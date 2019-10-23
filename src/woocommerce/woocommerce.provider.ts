import { Provider } from '../provider';

export class WoocommerceProvider extends Provider {
  constructor() {
    super('woocommerce', {
      type: 'object',
      additionalProperties: false,
      properties: {
        endpoint: {
          type: 'string'
        }
      },
      required: ['endpoint']
    });
  }
}
