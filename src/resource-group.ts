import { Args } from './args';
import { Plugin } from './plugin';
import { Shopify } from './shopify';
import { Null } from './null';
import { FS } from './fs';
import { DShipChina } from './dshipchina';
import { Resource } from './resource';
import * as _ from 'lodash';
import * as EventEmitter from 'events';
const chalk = require('chalk');

function iterateObject(obj: any, cb: any, path: string[] = []) {
  obj = cb(obj, path.join('.'));
  if (obj instanceof Array) {
    for (let i = 0; i < obj.length; ++i) {
      obj[i] = iterateObject(obj[i], cb, _.concat(path, String(i)));
    }
  } else if (obj instanceof Object) {
    for (let k in obj) {
      obj[k] = iterateObject(obj[k], cb, _.concat(path, k));
    }
  }
  return obj;
}

export class ResourceGroup extends EventEmitter {
  public state: any = {};
  private plugins = new Map<string, Plugin>();

  constructor() {
    super();
    this.plugins.set('shopify', new Shopify());
    this.plugins.set('null', new Null());
    this.plugins.set('fs', new FS());
    this.plugins.set('dshipchina', new DShipChina());
  }

  addPlugin(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
  }

  async diff(input: any) {
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
      resources[name] = resource;
      syncData[name] = null;
      if (this.state[name] && this.state[name].data) {
        syncData[name] = await resource.sync(_.cloneDeep(this.state[name].data), _.cloneDeep(this.state[name].attributes));
      }
      depends[name] = [];
      if (input[name] != null) {
        iterateObject(input[name], (obj: any, path: string) => {
          if (obj['$ref']) {
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
        input[name] = iterateObject(input[name], (obj: any, path: string) => {
          if (obj['$ref']) {
            let targetName = obj['$ref'].substr(0, obj['$ref'].lastIndexOf(':'));
            let targetAttr = obj['$ref'].substr(obj['$ref'].lastIndexOf(':') + 1);
            let fetch = () => _.get(this.state[targetName].attributes, targetAttr);
            if (syncData[name] === null || this.state[targetName].data === null) {
              return fetch;
            } else if (!this.state._original || !this.state._original[name]) {
              return fetch;
            } else {
              if (!_.isEqual(_.get(this.state._original[name], path), obj)) {
                return fetch;
              }
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
                return _.get(syncData[name], path);
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
