import * as request from 'request-promise-native';
import { Plugin } from '../plugin';
import { Product } from './product';

export class ShopifyStorefront extends Plugin {
  constructor() {
    super('shopify-storefront')
    this.addResource('product', Product);
  }
}
