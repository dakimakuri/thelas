import { Provider } from '../provider';

export class DShipChinaProvider extends Provider {
  constructor() {
    super('dshipchina', {
      type: 'object',
      additionalProperties: false,
      properties: {
        key: {
          type: 'string'
        }
      },
      required: ['key']
    });
  }
}
