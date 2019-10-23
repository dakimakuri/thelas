import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent, ResourceSyncEvent } from '../resource';

let cache: any = {};
async function getVariations(endpoint: string, productId: number) {
  let key = endpoint + ':' + productId;
  if (cache[key]) {
    return cache[key];
  }
  let page = 1;
  let variations = [];
  while (true) {
    let response = JSON.parse(await request.get(endpoint + '/products/' + productId + '/variations?per_page=100&page=' + page));
    if (response.length === 0) break;
    variations = _.concat(variations, response);
    page++;
  }
  cache[key] = variations;
  return cache[key];
}

async function getVariation(endpoint: string, productId: number, id: number) {
  let variations = await getVariations(endpoint, productId);
  return _.find(variations, { id }) as any;
}

export class ProductVariationResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        product_id: {
          type: 'number',
          required: true,
          fragile: true
        },
        description: {
          type: 'string',
          required: true
        },
        sku: {
          type: 'string',
          required: true
        },
        price: {
          type: 'string',
          default: '0'
        },
        regular_price: {
          type: 'string',
          default: '0'
        },
        sale_price: {
          type: 'string',
          default: ''
        },
        on_sale: {
          type: 'boolean',
          default: false
        },
        visible: {
          type: 'boolean',
          default: true
        },
        purchasable: {
          type: 'boolean',
          default: true
        },
        virtual: {
          type: 'boolean',
          default: false
        },
        downloadable: {
          type: 'boolean',
          default: false
        },
        tax_status: {
          type: 'string',
          default: 'taxable'
        },
        tax_class: {
          type: 'string',
          default: ''
        },
        manage_stock: {
          type: 'boolean',
          default: false
        },
        in_stock: {
          type: 'boolean',
          default: true
        },
        backorders: {
          type: 'string',
          default: 'no'
        },
        backorders_allowed: {
          type: 'boolean',
          default: false
        },
        backordered: {
          type: 'boolean',
          default: false
        },
        weight: {
          type: 'string',
          default: '0'
        },
        dimensions: {
          type: 'object',
          properties: {
            length: {
              type: 'string',
              required: true
            },
            width: {
              type: 'string',
              required: true
            },
            height: {
              type: 'string',
              required: true
            }
          },
          default: {
            length: '',
            width: '',
            height: ''
          }
        },
        shipping_class: {
          type: 'string',
          default: ''
        },
        shipping_class_id: {
          type: 'number',
          default: 0
        },
        attributes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                required: true
              },
              option: {
                type: 'string',
                required: true
              }
            }
          }
        }
      }
    }, {
      providers: {
        woocommerce: 'woocommerce'
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    let endpoint = this.providers['woocommerce'].endpoint;
    let variation = JSON.parse(await request.post(endpoint + '/products/' + event.data.product_id + '/variations', {
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(event.data)
    }));
    return this.attributes(variation);
  }

  async update(event: ResourceUpdateEvent) {
    let endpoint = this.providers['woocommerce'].endpoint;
    let variation = JSON.parse(await request.put(endpoint + '/products/' + event.data.product_id + '/variations/' + event.attributes.id, {
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(event.data)
    }));
    return this.attributes(variation);
  }

  async destroy(event: ResourceDestroyEvent) {
    /*let endpoint = this.providers['woocommerce'].endpoint;
    await request.delete(endpoint + '/products/' + event.attributes.id);*/
    throw new Error('NYI');
  }

  async sync(event: ResourceSyncEvent) {
    let endpoint = this.providers['woocommerce'].endpoint;
    //let variation = JSON.parse(await request.get(endpoint + '/products/' + event.data.product_id + '/variations/' + event.attributes.id));
    let variation = await getVariation(endpoint, event.data.product_id, event.attributes.id);
    event.data.description = variation.description;
    event.data.sku = variation.sku;
    event.data.price = variation.price;
    event.data.regular_price = variation.regular_price;
    event.data.sale_price = variation.sale_price;
    event.data.on_sale = variation.on_sale;
    event.data.visible = variation.visible;
    event.data.purchasable = variation.purchasable;
    event.data.virtual = variation.virtual;
    event.data.downloadable = variation.downloadable;
    event.data.tax_status = variation.tax_status;
    event.data.tax_class = variation.tax_class;
    event.data.manage_stock = variation.manage_stock;
    event.data.in_stock = variation.in_stock;
    event.data.backorders = variation.backorders;
    event.data.backorders_allowed = variation.backorders_allowed;
    event.data.backordered = variation.backordered;
    event.data.weight = variation.weight;
    event.data.dimensions = variation.dimensions;
    event.data.shipping_class = variation.shipping_class;
    event.data.shipping_class_id = variation.shipping_class_id;
    event.data.attributes = [];
    for (let attribute of variation.attributes) {
      event.data.attributes.push({
        name: attribute.name,
        option: attribute.option
      });
    }
    return event.data;
  }

  async import(id: string) {
    /*let shopify = this.providers['shopify'];
    let products = await getProducts(shopify);
    let product = _.find(products, { id }) as any;
    if (!product) {
      throw new Error('Shopify Product not found: ' + id);
    }
    return {
      data: {},
      attributes: this.attributes(product)
    };*/
    throw new Error('NYI');
  }

  private attributes(variation: any) {
    return { id: variation.id };
  }
}
