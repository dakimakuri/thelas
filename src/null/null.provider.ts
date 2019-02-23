import { Provider } from '../provider';

export class NullProvider extends Provider {
  constructor() {
    super('null', {
      type: 'object',
      additionalProperties: false,
      properties: {
        info: {
          type: 'string'
        }
      },
      required: ['info']
    });
  }
}
