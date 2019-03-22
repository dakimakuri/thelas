import * as _ from 'lodash';
import { TestPlugin } from './test.plugin';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent } from '../resource';

export class TraceResource extends Resource {
  constructor(private plugin: TestPlugin, name: string) {
    super(name, {
      type: 'object',
      properties: {
        fragileData: {
          type: 'json',
          default: {},
          fragile: true
        },
        data: {
          type: 'json',
          default: {},
          attributes: [ 'data' ]
        },
        privateData: {
          type: 'json',
          default: {}
        },
        tag: {
          type: 'string',
          default: ''
        },
        nullProperty: {
          type: 'string',
          allowNull: true
        }
      }
    }, {
      providers: {
        provider: 'test'
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    let provider = this.providers['provider'];
    let tag = (event.data.tag ? ('-' + event.data.tag) : '') + provider.tag;
    this.plugin.logs.push(`create.${this.name}${tag}`);
    return { fragileData: event.data.fragileData, data: event.data.data };
  }

  async update(event: ResourceUpdateEvent) {
    let provider = this.providers['provider'];
    let tag = (event.to.tag ? ('-' + event.to.tag) : '') + provider.tag;
    this.plugin.logs.push(`update.${this.name}${tag}`);
    return { fragileData: event.to.fragileData, data: event.to.data };
  }

  async destroy(event: ResourceDestroyEvent) {
    let provider = this.providers['provider'];
    let tag = (event.oldData.tag ? ('-' + event.oldData.tag) : '') + provider.tag;
    this.plugin.logs.push(`destroy.${this.name}${tag}`);
  }

  async sync(data: any, attributes: any) {
    let provider = this.providers['provider'];
    let tag = (data.tag ? ('-' + data.tag) : '') + provider.tag;
    this.plugin.logs.push(`sync.${this.name}${tag}`);
    return data;
  }

  async import(id: string) {
    let provider = this.providers['provider'];
    this.plugin.logs.push(`import.${this.name}${provider.tag}=${id}`);
    return {
      data: { imported: true },
      attributes: {}
    };
  }
}
