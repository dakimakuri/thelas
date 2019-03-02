import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent } from '../resource';

export class NullResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {}
    });
  }
  async create(event: ResourceCreateEvent) {
    return {};
  }
  async update(event: ResourceUpdateEvent) {
    return {};
  }
  async destroy(event: ResourceDestroyEvent) {
  }
  async sync(data: any, attributes: any) {
    return data;
  }
  async import(id: string) {
    return {
      data: {},
      attributes: {}
    };
  }
}
