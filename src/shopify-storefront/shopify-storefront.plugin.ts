import * as request from 'request-promise-native';
import { Plugin } from '../plugin';
import { ProductResource } from './product.resource';
import { ShopifyStorefrontProvider } from './shopify-storefront.provider';

export class ShopifyStorefrontPlugin extends Plugin {
  constructor() {
    super('shopify-storefront')
    this.addResource('product', ProductResource);
    this.addProvider('shopify-storefront', ShopifyStorefrontProvider);
  }
}
