import * as request from 'request-promise-native';
import { Plugin } from '../plugin';
import { ProductResource } from './product.resource';

export class ShopifyStorefrontPlugin extends Plugin {
  constructor() {
    super('shopify-storefront')
    this.addResource('product', ProductResource);
  }
}
