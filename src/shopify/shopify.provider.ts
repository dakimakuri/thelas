import { Provider } from '../provider';

export class ShopifyProvider extends Provider {
  constructor() {
    super('shopify', {
      type: 'object',
      additionalProperties: false,
      properties: {
        api_key: {
          type: 'string'
        },
        password: {
          type: 'string'
        },
        shop: {
          type: 'string'
        }
      },
      required: ['api_key', 'password', 'shop']
    });
  }
}
