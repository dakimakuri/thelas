import { Args } from './args';
import { Plugin } from './plugin';
import { TestPlugin } from './test';
import { ShopifyPlugin } from './shopify';
import { ShopifyStorefrontPlugin } from './shopify-storefront';
import { NullPlugin } from './null';
import { FSPlugin } from './fs';
import { DShipChinaPlugin } from './dshipchina';
import { AWSPlugin } from './aws';
import { DiscordPlugin } from './discord';
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
    this.plugins.set('test', new TestPlugin());
    this.plugins.set('shopify', new ShopifyPlugin());
    this.plugins.set('shopify-storefront', new ShopifyStorefrontPlugin());
    this.plugins.set('null', new NullPlugin());
    this.plugins.set('fs', new FSPlugin());
    this.plugins.set('dshipchina', new DShipChinaPlugin());
    this.plugins.set('aws', new AWSPlugin());
    this.plugins.set('discord', new DiscordPlugin());
  }

  addPlugin(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
  }

  getPlugin(name: string) {
    return this.plugins.get(name);
  }

  upgradeState() {
    let version = this.state.version;
    if (version === undefined) {
      let keys = _.keys(this.state);
      if (this.state._original instanceof Object) {
        version = 1;
      } else if (keys.length === 0) {
        return;
      } else {
        throw new Error('Invalid state.');
      }
    }
    if (version === 1) {
      let resources = _.omit(this.state, [ '_order', '_original' ]);
      this.state = {
        version: 2,
        resources,
        order: this.state._order || [],
        original: this.state._original || [],
        providers: []
      };
    } else {
      return;
    }
    this.upgradeState();
  }

  private validateState() {
    this.upgradeState();
    this.state.version = 2;
    this.state.resources = this.state.resources || {};
    this.state.original = this.state.original || {};
    this.state.order = this.state.order || [];
    this.state.providers = this.state.providers || [];
  }

  private async parse(input: any) {
    let resources: any[] = [];
    let providers: any[] = [];

    // find resources and providers defined in input
    for (let name in input) {
      let spl = name.split('.');
      if (spl[0] === 'provider') {
        if (spl.length === 2) {
          spl.push('default');
        }
        if (spl.length !== 3) {
          throw new Error('Bad provider format: ' + name);
        }
        providers.push({
          type: spl[1],
          profile: spl[2],
          fqn: `provider.${spl[1]}.${spl[2]}`,
          data: input[name]
        });
      } else {
        if (spl.length !== 3) {
          throw new Error('Bad resource format: ' + name);
        }
        resources.push({
          pluginName: spl[0],
          type: spl[1],
          name: spl[2],
          fqn: name,
          data: input[name],
          oldData: this.state.original[name] ? this.state.original[name] : null
        });
      }
    }

    // add resources that previously existed but no longer exist (deleted resources)
    for (let name in this.state.resources) {
      if (input[name] == undefined) {
        let spl = name.split('.');
        resources.push({
          pluginName: spl[0],
          type: spl[1],
          name: spl[2],
          fqn: name,
          data: null,
          oldData: this.state.original[name]
        });
      }
    }

    // populate resource references
    for (let resource of resources) {
      resource.plugin = this.plugins.get(resource.pluginName);
      resource.instance = resource.plugin.createResource(resource.type, resource.fqn);
    }

    // link resources to providers and create default providers
    for (let resource of resources) {
      let data = resource.data || resource.oldData;
      resource.providers = [];
      for (let providerName in resource.instance.options.providers) {
        let providerType = resource.instance.options.providers[providerName];
        let providerProfile = data[providerName] || 'default';
        let providerFqn = `provider.${providerType}.${providerProfile}`;
        let provider: any = _.find(providers, { fqn: providerFqn } as any);
        if (!provider) {
          provider = _.find(this.state.providers, { fqn: providerFqn });
          if (provider) {
            providers.push(provider);
          }
        }
        if (!provider && providerProfile === 'default') {
          provider = {
            type: providerType,
            profile: providerProfile,
            fqn: providerFqn
          };
          providers.push(provider);
        }
        if (!provider) {
          throw new Error('Resource (' + resource.fqn + ') missing a provider: ' + providerFqn);
        }
        resource.providers.push({ name: providerName, ref: provider });
      }
    }

    // populate provider references
    let interpolator = new Interpolator();
    for (let provider of providers) {
      for (let plugin of Array.from(this.plugins.values())) {
        let instance = plugin.createProvider(provider.type, provider.fqn);
        if (instance) {
          provider.plugin = plugin;
          provider.instance = instance;
          break;
        }
      }
      if (!provider.plugin) {
        throw new Error('Failed to find plugin for provider: ' + provider.fqn);
      }
      if (!provider.data && provider.profile === 'default') {
        provider.data = provider.instance.defaultValue;
      }
      if (!provider.data) {
        throw new Error('No data for provider: ' + provider.fqn);
      }
      provider.data = await interpolator.preprocess(provider.data);
      provider.data = await interpolator.process(provider.data);
      provider.data = await Interpolator.postprocess(provider.data);
      provider.originalData = _.cloneDeep(provider.data);
    }

    return { resources, providers };
  }

  async diff(input: any) {
    // ensure state is valid
    this.validateState();

    // back input states
    input = _.cloneDeep(input);
    let originalInput = _.cloneDeep(input);

    // parse input data and generate resources and providers
    let { resources, providers } = await this.parse(input);

    // data buckets
    let depends: any = {};
    let syncData: any = {};

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
      let stateDiff = syncData[obj.name] === null || !this.state.original[obj.name] || !_.isEqual(_.get(this.state.original[obj.name], obj.path), _.get(originalInput[obj.name], obj.path)) || !this.state.resources[obj.resource] || this.state.resources[obj.resource].data === null;
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
        return () => this.state.resources[obj.resource] ? _.get(this.state.resources[obj.resource].attributes, obj.key) : null;
      } else {
        return this.state.resources[obj.resource] ? _.get(this.state.resources[obj.resource].attributes, obj.key) : null;
      }
    });


    for (let provider of providers) {
      await provider.instance.init(provider.data);
    }

    for (let resource of resources) {
      for (let provider of resource.providers) {
        resource.instance.providers[provider.name] = provider.ref.data;
        if (resource.data) {
          delete resource.data[provider.name];
        }
      }
      syncData[resource.fqn] = null;
      if (this.state.resources[resource.fqn] && this.state.resources[resource.fqn].data) {
        this.emit('sync', resource.fqn);
        syncData[resource.fqn] = await resource.instance.sync({ data: _.cloneDeep(this.state.resources[resource.fqn].data), attributes: _.cloneDeep(this.state.resources[resource.fqn].attributes) });
      }
      depends[resource.fqn] = [];
      await interpolator.preprocess(input[resource.fqn], { name: resource.fqn });
    }

    for (let provider of providers) {
      await provider.instance.cleanup(provider.data);
      _.forOwn(provider.data, (_, key) => delete provider.data[key])
      _.assign(provider.data, provider.originalData);
    }

    function checkCircularDependency(root: string, children: any[]) {
      for (let dependency of children) {
        if (dependency === root) {
          throw new Error('Circular dependency found in ' + root);
        }
        if (!depends[dependency]) {
          throw new Error('Depending on non-existent resource: ' + dependency);
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

    let updates: any[] = [];
    let diffs: any = {};
    for (let name of createOrder) {
      input[name] = await interpolator.process(input[name] || null);
      let resource = _.find(resources, { fqn: name });
      diffs[name] = Args.diff(resource.instance.args, syncData[name], input[name], false);
      updates.push({
        resource: resource.instance,
        data: input[name],
        originalData: originalInput[name],
        name,
        order: createOrder.indexOf(name),
        diff: diffs[name],
        sync: syncData[name]
      });
    }
    return { providers, updates };
  }

  async apply(diff: any) {
    this.validateState();
    this.state.providers = [];
    for (let provider of diff.providers) {
      this.state.providers.push({
        type: provider.type,
        profile: provider.profile,
        fqn: provider.fqn,
        data: provider.data
      });
      await provider.instance.init(provider.data);
    }
    let creates: any[] = [];
    let destroys: any[] = [];
    for (let update of diff.updates) {
      if (update.diff.different) {
        if (update.diff.create || update.diff.update) {
          let obj = _.clone(update);
          obj.diff = _.omit(obj.diff, ['destroy']);
          creates.push(obj);
        }
        if (update.diff.destroy) {
          let obj = _.clone(update);
          obj.diff = _.omit(obj.diff, ['create', 'update']);
          obj.destroyOrder = this.state.order.indexOf(update.name);
          destroys.push(obj);
        }
      }
    }
    creates = _.orderBy(creates, 'order');
    destroys = _.reverse(_.orderBy(destroys, 'destroyOrder'));
    for (let destroy of destroys) {
      this.emit('destroy', destroy.name);
      await destroy.resource.apply(destroy.diff, this.state.resources[destroy.name] ? this.state.resources[destroy.name].attributes : null);
      this.state.order = _.pull(this.state.order, destroy.name);
      delete this.state.resources[destroy.name];
      delete this.state.original[destroy.name];
      this.emit('done', destroy.name);
    }
    for (let create of creates) {
      if (create.diff.update) {
        this.emit('update', create.name);
      } else {
        this.emit('create', create.name);
      }
      let resourceState = await create.resource.apply(create.diff, this.state.resources[create.name] ? this.state.resources[create.name].attributes : null);
      this.state.order = _.uniq(_.concat(this.state.order, create.name));
      this.state.resources[create.name] = resourceState;
      this.state.original[create.name] = create.originalData;
      this.emit('done', create.name);
    }
    for (let provider of diff.providers) {
      await provider.instance.cleanup(provider.data);
      _.forOwn(provider.data, (_, key) => delete provider.data[key])
      _.assign(provider.data, provider.originalData);
    }
  }

  async import(diff: any, name: string, id: string) {
    this.validateState();
    let info = _.find(diff.updates, { name }) as any;
    let resource = info.resource;
    if (!resource) {
      throw new Error('Resource does not exist in input: ' + name);
    }
    for (let provider of diff.providers) {
      await provider.instance.init(provider.data);
    }
    let result = await resource.import(id);
    for (let provider of diff.providers) {
      await provider.instance.cleanup(provider.data);
      _.forOwn(provider.data, (_, key) => delete provider.data[key])
      _.assign(provider.data, provider.originalData);
    }
    this.state.original[name] = info.originalData;
    resource = _.find(diff.updates, { name: name }) as any;
    // TODO: detect if importing with out-of-date parent resource state, can get wrong values from dependencies
    _.assign(result.data, await Args.applyCalculations(info.data));
    this.state.resources[name] = result;
  }
}
