import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent, ResourceSyncEvent } from '../resource';

let listingsCache: any = {};
export async function getListings(provider: any): Promise<any> {
  if (!listingsCache[provider.shop]) {
    listingsCache[provider.shop] = JSON.parse(await request.get(`https://${provider.shop}.myshopify.com/admin/product_listings.json`, {
      auth: {
        user: provider.api_key,
        pass: provider.password,
        sendImmediately: false
      }
    })).product_listings;
  }
  return listingsCache[provider.shop];
}

export class ProductListingResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        product_id: {
          type: 'number',
          required: true,
          fragile: true
        }
      }
    }, {
      providers: {
        shopify: 'shopify'
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    let shopify = this.providers['shopify'];
    let product_listing = JSON.parse(await request.put(`https://${shopify.shop}.myshopify.com/admin/product_listings/${event.data.product_id}.json`, {
      auth: {
        user: shopify.api_key,
        pass: shopify.password,
        sendImmediately: false
      },
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        product_listing: event.data
      })
    })).product_listing;
    return this.attributes(product_listing);
  }

  async update(event: ResourceUpdateEvent) {
    throw new Error('Cannot update product listing.');
  }

  async destroy(event: ResourceDestroyEvent) {
    let shopify = this.providers['shopify'];
    await request.delete(`https://${shopify.shop}.myshopify.com/admin/product_listings/${event.data.product_id}.json`, {
      auth: {
        user: shopify.api_key,
        pass: shopify.password,
        sendImmediately: false
      }
    });
  }

  async sync(event: ResourceSyncEvent) {
    let shopify = this.providers['shopify'];
    let listings = await getListings(shopify);
    if (!_.find(listings, { product_id: event.data.product_id })) {
      return null;
    }
    return event.data;
  }

  async import(id: string) {
    let shopify = this.providers['shopify'];
    let listings = await getListings(shopify);
    if (!_.find(listings, { product_id: id })) {
      throw new Error('Failed to import product listing ' + id);
    }
    return {
      data: {
        product_id: id
      },
      attributes: {
        product_id: id
      }
    }
  }

  private attributes(product_listing: any) {
    return {
      product_id: product_listing.product_id
    };
  }
}
