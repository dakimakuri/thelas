import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { getProducts } from './shopify-plugin';
import { shopifyAuth, site } from './auth';

export namespace Product {
  export const args = {
    title: {
      type: 'string',
      required: true
    },
    body_html: {
      type: 'string',
      default: ''
    },
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            required: true
          }
        }
      },
      default: [
        {
          name: 'Title'
        }
      ]
    },
    variants: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          option1: {
            type: 'string',
            required: true
          },
          grams: {
            type: 'number',
            default: 0
          },
          sku: {
            type: 'string',
            default: ''
          },
          taxable: {
            type: 'boolean',
            default: true
          },
          price: {
            type: 'number',
            default: 0
          },
          requires_shipping: {
            type: 'boolean',
            default: true
          },
          inventory_management: {
            type: 'string',
            allowNull: true
          },
          inventory_policy: {
            type: 'string',
            default: 'deny'
          }
        }
      },
      default: [
        {
          option1: 'Default Title'
        }
      ]
    }
  };

  export async function create(event: any) {
    let data = translate(event.data, event.attributes);
    let product = JSON.parse(await request.post(`https://${site}.myshopify.com/admin/products.json`, {
      auth: shopifyAuth,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        product: data
      })
    })).product;
    return attributes(product);
  }

  export async function update(event: any) {
    let data = translate(event.to, event.attributes);
    let product = JSON.parse(await request.put(`https://${site}.myshopify.com/admin/products/${event.attributes.id}.json`, {
      auth: shopifyAuth,
      headers: {
          'content-type': 'application/json',
      },
      body: JSON.stringify({
        product: data
      })
    })).product;
    return attributes(product);
  }

  export async function destroy(event: any) {
    JSON.parse(await request.delete(`https://${site}.myshopify.com/admin/products/${event.attributes.id}.json`, {
      auth: shopifyAuth
    }));
  }

  export async function sync(data: any, attributes: any) {
    let products = await getProducts();
    let product = _.find(products, { id: attributes.id }) as any;
    if (!product) {
      return null;
    }
    data.title = product.title;
    data.body_html = product.body_html;
    data.options = [];
    for (let option of product.options) {
      data.options.push({
        name: option.name
      });
    }
    data.variants = [];
    for (let variant of product.variants) {
      data.variants.push({
        option1: variant.option1,
        grams: variant.grams,
        sku: variant.sku,
        taxable: variant.taxable,
        price: Number(variant.price),
        requires_shipping: variant.requires_shipping,
        inventory_management: variant.inventory_management,
        inventory_policy: variant.inventory_policy
      });
    }
    return data;
  }

  function translate(data: any, attributes: any) {
    data = _.clone(data);
    if (attributes) {
      data.id = attributes.id;
      for (let i = 0; i < data.options.length; ++i) {
        data.options[i].id = attributes.options[i];
      }
      for (let i = 0; i < data.variants.length; ++i) {
        data.variants[i].id = attributes.variants[i];
      }
    }
    return data;
  }

  function attributes(product: any) {
    let options: number[] = [];
    let variants: number[] = [];
    for (let option of product.options) {
      options.push(option.id);
    }
    for (let variant of product.variants) {
      variants.push(variant.id);
    }
    return {
      id: product.id,
      options,
      variants
    };
  }
}
