import { Provider } from '../provider';

export class ShopifyStorefrontProvider extends Provider {
  constructor() {
    super('shopify-storefront', {
      type: 'object',
      additionalProperties: false,
      properties: {
        domain: {
          type: 'string'
        },
        access_token: {
          type: 'string'
        }
      },
      required: ['domain', 'access_token']
    });
  }
}
