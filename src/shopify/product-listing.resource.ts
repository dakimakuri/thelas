import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent } from '../resource';
import { ShopifyProvider } from './shopify.provider';

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
        shopify: ShopifyProvider
      }
    });
  }

  async create(event: any) {
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

  async update(event: any) {
    throw new Error('Cannot update product listing.');
  }

  async destroy(event: any) {
    let shopify = this.providers['shopify'];
    await request.delete(`https://${shopify.shop}.myshopify.com/admin/product_listings/${event.oldData.product_id}.json`, {
      auth: {
        user: shopify.api_key,
        pass: shopify.password,
        sendImmediately: false
      }
    });
  }

  async sync(data: any, attributes: any) {
    let shopify = this.providers['shopify'];
    try {
      await request.get(`https://${shopify.shop}.myshopify.com/admin/product_listings/${data.product_id}.json`, {
        auth: {
          user: shopify.api_key,
          pass: shopify.password,
          sendImmediately: false
        }
      });
      return data;
    } catch (err) {
      return null;
    }
  }

  import(id: string) {
    throw new Error('NYI');
  }

  private attributes(product_listing: any) {
    return {
      product_id: product_listing.product_id
    };
  }
}
