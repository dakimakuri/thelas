import * as request from 'request-promise-native';
import { Plugin } from '../plugin';
import { ProductResource } from './product.resource';
import { ProductVariationResource } from './product-variation.resource';
import { WoocommerceProvider } from './woocommerce.provider';

export class WoocommercePlugin extends Plugin {
  constructor() {
    super('woocommerce')
    this.addResource('product', ProductResource);
    this.addResource('product-variation', ProductVariationResource);
    this.addProvider('woocommerce', WoocommerceProvider);
  }
}
