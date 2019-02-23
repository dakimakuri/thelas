import { Args } from './args';
import { Plugin } from './plugin';
import { Shopify } from './shopify';
import { ShopifyStorefront } from './shopify-storefront';
import { Null } from './null';
import { FS } from './fs';
import { DShipChina } from './dshipchina';
import { AWS } from './aws';
import { Resource } from './resource';
import { validate } from 'jsonschema';
import * as _ from 'lodash';
import * as EventEmitter from 'events';
const chalk = require('chalk');

function iterateObject(obj: any, cb: any, path: string[] = []) {
  if (obj instanceof Array) {
    for (let i = 0; i < obj.length; ++i) {
      obj[i] = iterateObject(obj[i], cb, _.concat(path, String(i)));
    }
  } else if (obj instanceof Object) {
    for (let k in obj) {
      obj[k] = iterateObject(obj[k], cb, _.concat(path, k));
    }
  }
  return cb(obj, path.join('.'));
}

export class ResourceGroup extends EventEmitter {
  public state: any = {};
  private plugins = new Map<string, Plugin>();

  constructor() {
    super();
    this.plugins.set('shopify', new Shopify());
    this.plugins.set('shopify-storefront', new ShopifyStorefront());
    this.plugins.set('null', new Null());
    this.plugins.set('fs', new FS());
    this.plugins.set('dshipchina', new DShipChina());
    this.plugins.set('aws', new AWS());
  }

  addPlugin(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
  }

  async diff(input: any) {
    input = _.cloneDeep(input);
    let originalInput = _.cloneDeep(input);
    let syncData: any = {};
    let resources: any = {};
    let diffs: any = {};
    let depends: any = {};
    let updates: any[] = [];
    let found = [];
    for (let key in this.state) {
      if (key.length > 0 && key[0] === '_') {
        continue;
      }
      if (input[key] == undefined) {
        input[key] = null;
      }
    }
    let providers: any = {};
    for (let name in input) {
      let spl = name.split('.');
      if (spl[0] === 'provider') {
        if (spl.length == 2) {
          spl.push('default');
        }
        if (spl.length != 3) {
          throw new Error('Bad provider format: ' + name);
        }
        providers[spl[1]] = providers[spl[1]] || {};
        providers[spl[1]][spl[2]] = input[name];
        delete input[name];
      }
    }
    for (let name in input) {
      let spl = name.split('.');
      if (spl.length != 3) {
        throw new Error('Bad resource format: ' + name);
      }
      let plugin = this.plugins.get(spl[0]);
      if (!plugin) {
        throw new Error('Invalid plugin: ' + spl[0]);
      }
      let resourceType = plugin.getResource(spl[1]);
      if (!resourceType) {
        throw new Error('Invalid resource type: ' + spl[0] + '.' + spl[1]);
      }
      let resource = new resourceType(name);
      for (let key in resource.options.providers) {
        let profile = 'default';
        if (input[name]) {
          if (input[name][key]) {
            profile = input[name][key];
            delete input[name][key];
          }
        } else if (this.state._original[name]) {
          if (this.state._original[name][key]) {
            profile = this.state._original[name][key];
          }
        } else {
          throw new Error('Resource (' + name + ') missing provider information.');
        }
        let provider = resource.options.providers[key]();
        if (!providers[provider.name] || !providers[provider.name][profile]) {
          throw new Error('Resource (' + name + ') missing a provider: ' + key);
        }
        validate(providers[provider.name][profile], provider.schema, { throwError: true });
        resource.providers[key] = providers[provider.name][profile];
      }
      resources[name] = resource;
      syncData[name] = null;
      if (this.state[name] && this.state[name].data) {
        syncData[name] = await resource.sync(_.cloneDeep(this.state[name].data), _.cloneDeep(this.state[name].attributes));
      }
      depends[name] = [];
      if (input[name] != null) {
        iterateObject(input[name], (obj: any, path: string) => {
          if (obj && obj['$ref']) {
            let targetName = obj['$ref'].substr(0, obj['$ref'].lastIndexOf(':'));
            depends[name].push(targetName);
          }
          return obj;
        });
      }
      found.push(name);
    }
    function checkCircularDependency(root: string, children: any[]) {
      for (let dependency of children) {
        if (dependency === root) {
          throw new Error('Circular dependency found in ' + root);
        }
        checkCircularDependency(root, depends[dependency]);
      }
    }
    let createKeys: string[] = [];
    for (let key in depends) {
      checkCircularDependency(key, depends[key]);
      createKeys.push(key);
    }
    let createOrder = [];
    while (createKeys.length > 0) {
      for (let i = 0; i < createKeys.length; ++i) {
        let key = createKeys[i];
        let create = true;
        for (let depend of depends[key]) {
          if (createOrder.indexOf(depend) === -1) {
            create = false;
            break;
          }
        }
        if (create) {
          createOrder.push(createKeys[i]);
          createKeys.splice(i, 1);
          break;
        }
      }
    }
    for (let name of createOrder) {
      if (input[name] != null) {
        input[name] = iterateObject(input[name], (obj: any, path: string, parent: any) => {
          let root = true;
          if (path !== '') {
            let spl = path.split('.');
            for (let i = 0; i < spl.length; ++i) {
              if (spl[i] === '$ref' || spl[i] === '$str' || spl[i] === '$array' || spl[i] === '$map' || spl[i] === '$findBy') {
                root = false;
              }
            }
          }
          let stateDiff = !root || syncData[name] === null || !this.state._original || !this.state._original[name] || !_.isEqual(_.get(this.state._original[name], path), _.get(originalInput[name], path));
          if (obj['$ref']) {
            let targetName = obj['$ref'].substr(0, obj['$ref'].lastIndexOf(':'));
            let targetAttr = obj['$ref'].substr(obj['$ref'].lastIndexOf(':') + 1);
            let fetch = () => _.get(this.state[targetName].attributes, targetAttr);
            if (stateDiff || this.state[targetName].data === null) {
              return fetch;
            } else {
              let changedAttrs: string[] = [];
              for (let change of diffs[targetName].changes) {
                changedAttrs = _.concat(changedAttrs, change.schema.attributes);
                if (change.schema.fragile) {
                  return null;
                }
              }
              changedAttrs = _.uniq(changedAttrs);
              if (!changedAttrs || changedAttrs.indexOf(targetAttr) != -1) {
                return fetch;
              } else {
                if (root) {
                  return _.get(syncData[name], path);
                } else {
                  return obj;
                }
              }
            }
          } else if (obj['$str'] != null) {
            if (!stateDiff) {
              return _.get(syncData[name], path);
            }
            if (obj['$str'] instanceof Function) {
              return () => JSON.stringify(obj['$str'](), null, 2);
            } else {
              return JSON.stringify(obj['$str'], null, 2);
            }
          } else if (obj['$map'] != null) {
            if (!stateDiff) {
              return _.get(syncData[name], path);
            }
            let result: any = {};
            let fn = false;
            for (let key in obj['$map']) {
              if (obj['$map'][key] instanceof Function) {
                fn = true;
              }
              result[key] = obj['$map'][key];
            }
            if (fn) {
              return () => {
                for (let key in result) {
                  if (result[key] instanceof Function) {
                    result[key] = result[key]();
                  }
                }
                return result;
              };
            } else {
              return result;
            }
          } else if (obj['$array'] != null) {
            if (!stateDiff) {
              return _.get(syncData[name], path);
            }
            let result: any = [];
            let fn = false;
            for (let i = 0; i < obj['$array'].length; ++i) {
              if (obj['$array'][i] instanceof Function) {
                fn = true;
              }
              result.push(obj['$array'][i]);
            }
            if (fn) {
              return () => {
                for (let i = 0; i < result.length; ++i) {
                  if (result[i] instanceof Function) {
                    result[i] = result[i]();
                  }
                }
                return result;
              };
            } else {
              return result;
            }
          } else if (obj['$findBy'] != null) {
            if (!stateDiff) {
              return _.get(syncData[name], path);
            }
            let collection = obj['$findBy'].collection;
            let key = obj['$findBy'].key;
            let value = obj['$findBy'].value;
            let prop = obj['$findBy'].prop;
            if (collection instanceof Function || key instanceof Function || value instanceof Function) {
              return () => {
                if (collection instanceof Function) collection = collection();
                if (key instanceof Function) key = key();
                if (value instanceof Function) value = value();
                if (prop instanceof Function) prop = value();
                let predicate: any = {};
                predicate[key] = value;
                let f = _.find(collection, predicate);
                if (prop) {
                  return f[prop];
                } else {
                  return f;
                }
              };
            } else {
              let predicate: any = {};
              predicate[key] = value;
              let f = _.find(collection, predicate)[key];
              if (prop) {
                return f[prop];
              } else {
                return f;
              }
            }
          }
          return obj;
        });
        if (input[name].depends) {
          delete input[name]['depends'];
        }
      }
      let resource = resources[name];
      diffs[name] = Args.diff(resource.args, syncData[name], input[name], false);
      updates.push({
        resource,
        data: input[name],
        originalData: originalInput[name],
        name,
        order: createOrder.indexOf(name),
        diff: diffs[name],
        sync: syncData[name]
      });
    }
    return updates;
  }

  async apply(updates: any[]) {
    if (!(this.state._order instanceof Array)) {
      this.state._order = [];
    }
    if (!(this.state._original instanceof Object)) {
      this.state._original = {};
    }
    let creates: any[] = [];
    let destroys: any[] = [];
    for (let update of updates) {
      if (update.diff.different) {
        if (update.diff.create || update.diff.update) {
          let obj = _.clone(update);
          obj.diff = _.omit(obj.diff, ['destroy']);
          creates.push(obj);
        }
        if (update.diff.destroy) {
          let obj = _.clone(update);
          obj.diff = _.omit(obj.diff, ['create', 'update']);
          obj.destroyOrder = this.state._order.indexOf(update.name);
          destroys.push(obj);
        }
      }
    }
    creates = _.orderBy(creates, 'order');
    destroys = _.reverse(_.orderBy(destroys, 'destroyOrder'));
    for (let destroy of destroys) {
      this.emit('destroy', destroy.name);
      await destroy.resource.apply(destroy.diff, this.state[destroy.name] ? this.state[destroy.name].attributes : null);
      this.state._order = _.pull(this.state._order, destroy.name);
      delete this.state[destroy.name];
      delete this.state._original[destroy.name];
      this.emit('done', destroy.name);
    }
    for (let create of creates) {
      if (create.diff.update) {
        this.emit('update', create.name);
      } else {
        this.emit('create', create.name);
      }
      let resourceState = await create.resource.apply(create.diff, this.state[create.name] ? this.state[create.name].attributes : null);
      this.state._order = _.uniq(_.concat(this.state._order, create.name));
      this.state[create.name] = resourceState;
      this.state._original[create.name] = create.originalData;
      this.emit('done', create.name);
    }
  }
}
