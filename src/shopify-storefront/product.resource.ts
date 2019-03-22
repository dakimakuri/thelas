declare let require: any;
require('isomorphic-fetch');
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent, ResourceSyncEvent } from '../resource';
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
        storefront: 'shopify-storefront'
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    let sf = this.providers['storefront'];
    let products = await getProducts(sf.domain, sf.access_token);
    for (let product of products) {
      if (product.handle === event.data.handle) {
        let result: any = { id: product.id, handle: product.handle, variants: [] };
        for (let variant of product.variants) {
          result.variants.push({
            id: variant.id,
            sku: variant.sku,
            title: variant.title
          });
        }
        return result;
      }
    }
    throw new Error('Cannot find shopify storefront product: ' + event.data.handle);
  }

  async update(event: ResourceUpdateEvent) {
    throw new Error('Cannot update shopify storefront product.');
  }

  async destroy(event: ResourceDestroyEvent) {
  }

  async sync(event: ResourceSyncEvent) {
    return event.data;
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
            sku: variant.sku,
            title: variant.title
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
