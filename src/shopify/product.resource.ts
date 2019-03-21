import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent } from '../resource';
import { getProducts } from './shopify.plugin';

export class ProductResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          required: true
        },
        handle: {
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
      }
    }, {
      providers: {
        shopify: 'shopify'
      }
    });
  }

  async create(event: any) {
    let shopify = this.providers['shopify'];
    let data = this.translate(event.data, event.attributes);
    let product = JSON.parse(await request.post(`https://${shopify.shop}.myshopify.com/admin/products.json`, {
      auth: {
        user: shopify.api_key,
        pass: shopify.password,
        sendImmediately: false
      },
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        product: data
      })
    })).product;
    return this.attributes(product);
  }

  async update(event: any) {
    let shopify = this.providers['shopify'];
    let data = this.translate(event.to, event.attributes);
    let product = JSON.parse(await request.put(`https://${shopify.shop}.myshopify.com/admin/products/${event.attributes.id}.json`, {
      auth: {
        user: shopify.api_key,
        pass: shopify.password,
        sendImmediately: false
      },
      headers: {
          'content-type': 'application/json',
      },
      body: JSON.stringify({
        product: data
      })
    })).product;
    return this.attributes(product);
  }

  async destroy(event: any) {
    let shopify = this.providers['shopify'];
    JSON.parse(await request.delete(`https://${shopify.shop}.myshopify.com/admin/products/${event.attributes.id}.json`, {
      auth: {
        user: shopify.api_key,
        pass: shopify.password,
        sendImmediately: false
      }
    }));
  }

  async sync(data: any, attributes: any) {
    let shopify = this.providers['shopify'];
    let products = await getProducts(shopify);
    let product = _.find(products, { id: attributes.id }) as any;
    if (!product) {
      return null;
    }
    data.title = product.title;
    data.handle = product.handle;
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

  async import(id: string) {
    let shopify = this.providers['shopify'];
    let products = await getProducts(shopify);
    let product = _.find(products, { id }) as any;
    if (!product) {
      throw new Error('Shopify Product not found: ' + id);
    }
    return {
      data: {},
      attributes: this.attributes(product)
    };
  }

  private translate(data: any, attributes: any) {
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

  private attributes(product: any) {
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
