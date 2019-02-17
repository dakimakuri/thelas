import * as request from 'request-promise-native';
import { Plugin } from '../plugin';
import { Product } from './product';
import { ProductImage } from './product-image';
import { ProductListing } from './product-listing';
import { shopifyAuth, site } from './auth';

export class Shopify extends Plugin {
  constructor() {
    super('shopify')
    this.addResource('product', Product);
    this.addResource('product-image', ProductImage);
    this.addResource('product-listing', ProductListing);
  }
}

let productCache: any = null;
export async function getProducts(): Promise<any> {
  if (!productCache) {
    productCache = JSON.parse(await request.get(`https://${site}.myshopify.com/admin/products.json?limit=250`, {
      auth: shopifyAuth
    })).products;
  }
  return productCache;
}
