import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { shopifyAuth, site } from './auth';

export namespace ProductListing {
  export const args = {
    product_id: {
      type: 'number',
      required: true,
      fragile: true
    }
  };

  export async function create(event: any) {
    let product_listing = JSON.parse(await request.put(`https://${site}.myshopify.com/admin/product_listings/${event.data.product_id}.json`, {
      auth: shopifyAuth,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        product_listing: event.data
      })
    })).product_listing;
    return attributes(product_listing);
  }

  export async function update(event: any) {
    throw new Error('Cannot update product listing.');
  }

  export async function destroy(event: any) {
    await request.delete(`https://${site}.myshopify.com/admin/product_listings/${event.oldData.product_id}.json`, {
      auth: shopifyAuth
    });
  }

  export async function sync(data: any, attributes: any) {
    try {
      await request.get(`https://${site}.myshopify.com/admin/product_listings/${data.product_id}.json`, {
        auth: shopifyAuth
      });
      return data;
    } catch (err) {
      return null;
    }
  }

  function attributes(product_listing: any) {
    return {
      product_id: product_listing.product_id
    };
  }
}
