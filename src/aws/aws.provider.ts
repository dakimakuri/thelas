import { Provider } from '../provider';

export class AWSProvider extends Provider {
  constructor() {
    super('aws', {
      type: 'object',
      additionalProperties: false,
      properties: {
        access_key: {
          type: 'string'
        },
        secret_key: {
          type: 'string'
        },
        region: {
          type: 'string'
        }
      },
      required: ['access_key', 'secret_key', 'region']
    });
  }
}
