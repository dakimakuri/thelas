import { Args } from './args';
import { Plugin } from './plugin';
import { ShopifyPlugin } from './shopify';
import { ShopifyStorefrontPlugin } from './shopify-storefront';
import { NullPlugin } from './null';
import { FSPlugin } from './fs';
import { DShipChinaPlugin } from './dshipchina';
import { AWSPlugin } from './aws';
import { Resource } from './resource';
import { Interpolator } from './interpolation';
import { validate } from 'jsonschema';
import * as _ from 'lodash';
import * as EventEmitter from 'events';
import * as md5 from 'md5';
import * as fs from 'fs';
const chalk = require('chalk');

export class ResourceGroup extends EventEmitter {
  public state: any = {};
  private plugins = new Map<string, Plugin>();

  constructor() {
    super();
    this.plugins.set('shopify', new ShopifyPlugin());
    this.plugins.set('shopify-storefront', new ShopifyStorefrontPlugin());
    this.plugins.set('null', new NullPlugin());
    this.plugins.set('fs', new FSPlugin());
    this.plugins.set('dshipchina', new DShipChinaPlugin());
    this.plugins.set('aws', new AWSPlugin());
  }

  addPlugin(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
  }

  private buildResources(input: any) {
    let resources: any = {};
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
    }
    return resources;
  }

  async diff(input: any) {
    input = _.cloneDeep(input);
    let originalInput = _.cloneDeep(input);
    let syncData: any = {};
    let resources: any = this.buildResources(input);
    let diffs: any = {};
    let depends: any = {};
    let updates: any[] = [];
    let found = [];
    let interpolator = new Interpolator();
    interpolator.pre('ref', (value: any, path: string, context: any) => {
      let index = value.indexOf(':');
      if (index === -1) {
        throw new Error('Bad $ref: ' + value);
      }
      let resource = value.substr(0, index);
      let key = value.substr(index + 1);
      depends[context.name].push(resource);
      return { resource, key, path, name: context.name };
    });
    interpolator.op('ref', (obj: any) => {
      let stateDiff = syncData[obj.name] === null || !this.state._original || !this.state._original[obj.name] || !_.isEqual(_.get(this.state._original[obj.name], obj.path), _.get(originalInput[obj.name], obj.path)) || !this.state[obj.resource] || this.state[obj.resource].data === null;
      if (!stateDiff) {
        let changedAttrs: string[] | null = [];
        for (let change of diffs[obj.resource].changes) {
          changedAttrs = _.concat(changedAttrs, change.schema.attributes);
          if (change.schema.fragile) {
            changedAttrs = null;
          }
        }
        if (!changedAttrs || _.uniq(changedAttrs).indexOf(obj.key) != -1) {
          stateDiff = true;
        }
      }
      if (stateDiff) {
        return () => this.state[obj.resource] ? _.get(this.state[obj.resource].attributes, obj.key) : null;
      } else {
        return this.state[obj.resource] ? _.get(this.state[obj.resource].attributes, obj.key) : null;
      }
    });
    for (let name in resources) {
      syncData[name] = null;
      if (this.state[name] && this.state[name].data) {
        this.emit('sync', name);
        syncData[name] = await resources[name].sync(_.cloneDeep(this.state[name].data), _.cloneDeep(this.state[name].attributes));
      }
      depends[name] = [];
      await interpolator.preprocess(input[name], { name });
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
      input[name] = await interpolator.process(input[name]);
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

  async import(diff: any, name: string, id: string) {
    let info = _.find(diff, { name }) as any;
    let resource = info.resource;
    if (!resource) {
      throw new Error('Resource does not exist in input: ' + name);
    }
    let result = await resource.import(id);
    this.state._original = this.state._original || {};
    this.state._original[name] = info.originalData;
    resource = _.find(diff, { name: name }) as any;
    // TODO: detect if importing with out-of-date parent resource state, can get wrong values from dependencies
    _.assign(result.data, await Args.applyCalculations(info.data));
    this.state[name] = result;
  }
}
