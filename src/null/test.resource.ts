import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent, ResourceSyncEvent } from '../resource';

export class TestResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          required: true,
          attributes: [ 'text' ]
        }
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    console.log('Create:', event.data.text);
    console.log();
    return {
      text: event.data.text,
      stuff: [ 1, 2, 3 ]
    };
  }

  async update(event: ResourceUpdateEvent) {
    console.log('Update:', event.data.text);
    console.log();
    return {
      text: event.data.text,
      stuff: [ 1, 2, 3 ]
    };
  }

  async destroy(event: ResourceDestroyEvent) {
    console.log('Destroy:', event.data.text);
    console.log();
  }

  async sync(event: ResourceSyncEvent) {
    return event.data;
  }

  import(id: string) {
    throw new Error('NYI');
  }
}
