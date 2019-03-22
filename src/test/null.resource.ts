import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent, ResourceSyncEvent } from '../resource';

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
  async sync(event: ResourceSyncEvent) {
    return event.data;
  }
  async import(id: string) {
    return {
      data: {},
      attributes: {}
    };
  }
}
