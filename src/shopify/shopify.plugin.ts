import * as request from 'request-promise-native';
import { Plugin } from '../plugin';
import { Product } from './product.resource';
import { ProductImage } from './product-image.resource';
import { ProductListing } from './product-listing.resource';

export class Shopify extends Plugin {
  constructor() {
    super('shopify')
    this.addResource('product', Product);
    this.addResource('product-image', ProductImage);
    this.addResource('product-listing', ProductListing);
  }
}

let productCache: any = {};
export async function getProducts(shopify: any): Promise<any> {
  if (!productCache[shopify.shop]) {
    productCache[shopify.shop] = JSON.parse(await request.get(`https://${shopify.shop}.myshopify.com/admin/products.json?limit=250`, {
      auth: {
        user: shopify.api_key,
        pass: shopify.password,
        sendImmediately: false
      }
    })).products;
  }
  return productCache[shopify.shop];
}
