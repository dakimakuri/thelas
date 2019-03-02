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
        }
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    this.plugin.logs.push(`create.${this.name}`);
    return { fragileData: event.data.fragileData, data: event.data.data };
  }

  async update(event: ResourceUpdateEvent) {
    this.plugin.logs.push(`update.${this.name}`);
    return { fragileData: event.to.fragileData, data: event.to.data };
  }

  async destroy(event: ResourceDestroyEvent) {
    this.plugin.logs.push(`destroy.${this.name}`);
  }

  async sync(data: any, attributes: any) {
    this.plugin.logs.push(`sync.${this.name}`);
    return data;
  }

  async import(id: string) {
    this.plugin.logs.push(`import.${this.name}`);
    return {
      data: {},
      attributes: {}
    };
  }
}
