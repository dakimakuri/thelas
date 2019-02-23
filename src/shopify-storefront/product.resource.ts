declare let require: any;
require('isomorphic-fetch');
import { Resource } from '../resource';
import { ShopifyStorefrontProvider } from './shopify-storefront.provider';
const shopify = require('shopify-buy');

let productCache: any = {};
export async function getProducts(domain: string, storefrontAccessToken: string): Promise<any> {
  let key = storefrontAccessToken;
  let storefront = shopify.buildClient({ domain, storefrontAccessToken });
  if (!productCache[key]) {
    productCache[key] = await storefront.product.fetchAll(250);
  }
  return productCache[key];
}

export class ProductResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        handle: {
          type: 'string',
          required: true,
          fragile: true
        }
      }
    }, {
      providers: {
        storefront: ShopifyStorefrontProvider
      }
    });
  }

  async create(event: any) {
    let sf = this.providers['storefront'];
    let products = await getProducts(sf.domain, sf.access_token);
    for (let product of products) {
      if (product.handle === event.data.handle) {
        let result: any = { id: product.id, handle: product.handle, variants: [] };
        for (let variant of product.variants) {
          result.variants.push({
            id: variant.id,
            sku: variant.sku
          });
        }
        return result;
      }
    }
    throw new Error('Cannot find shopify storefront product: ' + event.data.handle);
  }

  async update(event: any) {
    throw new Error('Cannot update shopify storefront product.');
  }

  async destroy(event: any) {
  }

  async sync(data: any, attributes: any) {
    return data;
  }

  async import(id: string) {
    let sf = this.providers['storefront'];
    let products = await getProducts(sf.domain, sf.access_token);
    for (let product of products) {
      if (product.handle === id) {
        let result: any = { id: product.id, handle: product.handle, variants: [] };
        for (let variant of product.variants) {
          result.variants.push({
            id: variant.id,
            sku: variant.sku
          });
        }
        return {
          data: {
            handle: id
          },
          attributes: result
        };
      }
    }
    throw new Error('Failed to import shopify storefront product: ' + id);
  }
}
