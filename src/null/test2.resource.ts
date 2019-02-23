import { Resource } from '../resource';
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
        provider: NullProvider
      }
    });
  }

  async create(event: any) {
    console.log('Create:', event.data.text, this.providers);
    console.log();
    return {
      text: event.data,
      stuff: [ 1, 2, 3 ]
    };
  }

  async update(event: any) {
    console.log('Update:', event.to.text);
    console.log();
    return {
      text: event.data,
      stuff: [ 1, 2, 3 ]
    };
  }

  async destroy(event: any) {
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

