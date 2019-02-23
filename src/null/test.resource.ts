import { Resource } from '../resource';

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

  async create(event: any) {
    console.log('Create:', event.data.text);
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
}
