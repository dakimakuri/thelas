import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent } from '../resource';
import { NullProvider } from './null.provider';

export class Test2Resource extends Resource {
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
    }, {
      providers: {
        provider: 'null'
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    console.log('Create:', event.data.text, this.providers);
    console.log();
    return {
      text: event.data,
      stuff: [ 1, 2, 3 ]
    };
  }

  async update(event: ResourceUpdateEvent) {
    console.log('Update:', event.to.text);
    console.log();
    return {
      text: event.to,
      stuff: [ 1, 2, 3 ]
    };
  }

  async destroy(event: ResourceDestroyEvent) {
    console.log('Destroy:', event.oldData.text);
    console.log();
  }

  async sync(data: any) {
    return data;
  }

  import(id: string) {
    console.log(this.providers);
    throw new Error('NYI');
  }
}

