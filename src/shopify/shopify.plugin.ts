import * as request from 'request-promise-native';
import { Plugin } from '../plugin';
import { ProductResource } from './product.resource';
import { ProductImageResource } from './product-image.resource';
import { ProductListingResource } from './product-listing.resource';
import { ShopifyProvider } from './shopify.provider';

export class ShopifyPlugin extends Plugin {
  constructor() {
    super('shopify')
    this.addResource('product', ProductResource);
    this.addResource('product-image', ProductImageResource);
    this.addResource('product-listing', ProductListingResource);
    this.addResource('shopify', ShopifyProvider);
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
