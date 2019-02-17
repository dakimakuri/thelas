import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { getProducts } from './shopify-plugin';
import { shopifyAuth, site } from './auth';

export namespace ProductImage {
  export const args = {
    product_id: {
      type: 'number',
      required: true
    },
    attachment: {
      type: 'string',
      required: true
    },
    alt: {
      type: 'string',
      allowNull: true
    },
    variant_ids: {
      type: 'array',
      default: [],
      items: {
        type: 'number',
        required: true
      }
    }
  };

  export async function create(event: any) {
    let data = translate(event.data, event.attributes);
    let image = JSON.parse(await request.post(`https://${site}.myshopify.com/admin/products/${event.data.product_id}/images.json`, {
      auth: shopifyAuth,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        image: data
      })
    })).image;
    return attributes(image);
  }

  export async function update(event: any) {
    let data = translate(event.to, event.attributes);
    let image = JSON.parse(await request.put(`https://${site}.myshopify.com/admin/products/${event.to.product_id}/images/${event.attributes.id}.json`, {
      auth: shopifyAuth,
      headers: {
          'content-type': 'application/json',
      },
      body: JSON.stringify({
        image: data
      })
    })).image;
    return attributes(image);
  }

  export async function destroy(event: any) {
    JSON.parse(await request.delete(`https://${site}.myshopify.com/admin/products/${event.oldData.product_id}/images/${event.attributes.id}.json`, {
      auth: shopifyAuth
    }));
  }

  export async function sync(data: any, attributes: any) {
    let products = await getProducts();
    let product = _.find(products, { id: data.product_id }) as any;
    if (!product) {
      return null;
    }
    let image = _.find(product.images, { id: attributes.id }) as any;
    if (!image) {
      return null;
    }
    data.alt = image.alt;
    return data;
  }

  function translate(data: any, attributes: any) {
    data = _.clone(data);
    if (attributes) {
      data.id = attributes.id;
    }
    return data;
  }

  function attributes(image: any) {
    return {
      id: image.id
    };
  }
}
