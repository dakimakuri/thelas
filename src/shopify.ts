import * as request from 'request-promise-native';
import * as _ from 'lodash';

const shopifyAuth = {
  user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  pass: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  sendImmediately: false
};
const site = 'shop';

let productCache: any = null;

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
    if (!productCache) {
      productCache = JSON.parse(await request.get(`https://${site}.myshopify.com/admin/products.json?limit=250`, {
        auth: shopifyAuth
      })).products;
    }
    let product = _.find(productCache, { id: attributes.id }) as any;
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
    if (!productCache) {
      productCache = JSON.parse(await request.get(`https://${site}.myshopify.com/admin/products.json?limit=250`, {
        auth: shopifyAuth
      })).products;
    }
    let product = _.find(productCache, { id: data.product_id }) as any;
    if (!product) {
      return null;
    }
    if (!_.find(product.images, { id: attributes.id })) {
      return null;
    }
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

// body_html
// created_at (ro)
// handle
// id (ro)
// images (arr of image)
// options (custom product property, color, size, etc)
// product_type
// published_at
// published_scope
// tags
// template_suffix
// title (req)
// metafields_global_title_tag
// metafields_global_description_tag
// updated_at (ro)
// variants (arr of variant)
// vendor

// barcode
// compare_at_price
// created_at
// fulfillment_service
// grams
// id
// image_id
// inventory_item_id
// inventory_management
// inventory_policy
// inventory_quantity (ro)
// old_inventory_quantity (ro)
// inventory_quantity_adjustment (ro)
// metafields (kv pair)
// option1
// option2
// option3
// presentment_prices
// position
// price
// product_id
// requires_shipping
// sku
// taxable
// tax_code
// title
// updated_at
// weight
// weight_unit

// created_at
// id
// position
// product_id
// variant_ids
// src
// width
// height
// updated_at
