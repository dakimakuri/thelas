import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent, ResourceSyncEvent } from '../resource';

let cache: any = {};
async function getProducts(endpoint: string) {
  if (cache[endpoint]) {
    return cache[endpoint];
  }
  let page = 1;
  let products = [];
  while (true) {
    let response = JSON.parse(await request.get(endpoint + '/products?per_page=100&page=' + page));
    if (response.length === 0) break;
    products = _.concat(products, response);
    page++;
  }
  cache[endpoint] = products;
  return cache[endpoint];
}

async function getProduct(endpoint: string, id: number) {
  let products = await getProducts(endpoint);
  return _.find(products, { id }) as any;
}

export class ProductResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          required: true
        },
        slug: {
          type: 'string',
          required: true
        },
        type: {
          type: 'string',
          default: 'variable'
        },
        status: {
          type: 'string',
          default: 'publish'
        },
        catalog_visibility: {
          type: 'string',
          default: 'hidden'
        },
        reviews_allowed: {
          type: 'boolean',
          default: false
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
              visible: {
                type: 'boolean',
                default: true
              },
              variation: {
                type: 'boolean',
                default: true
              },
              options: {
                type: 'array',
                items: {
                  type: 'string',
                  required: true
                }
              }
            }
          },
          default: [
            {
              name: 'Title'
            }
          ]
        },
      }
    }, {
      providers: {
        woocommerce: 'woocommerce'
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    let endpoint = this.providers['woocommerce'].endpoint;
    let product = JSON.parse(await request.post(endpoint + '/products', {
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(event.data)
    }));
    return this.attributes(product);
  }

  async update(event: ResourceUpdateEvent) {
    let endpoint = this.providers['woocommerce'].endpoint;
    let product = JSON.parse(await request.put(endpoint + '/products/' + event.attributes.id, {
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(event.data)
    }));
    return this.attributes(product);
  }

  async destroy(event: ResourceDestroyEvent) {
    let endpoint = this.providers['woocommerce'].endpoint;
    await request.delete(endpoint + '/products/' + event.attributes.id);
  }

  async sync(event: ResourceSyncEvent) {
    let endpoint = this.providers['woocommerce'].endpoint;
    let product = await getProduct(endpoint, event.attributes.id);
    event.data.name = product.name;
    event.data.slug = product.slug;
    event.data.type = product.type;
    event.data.status = product.status;
    event.data.catalog_visibility = product.catalog_visibility;
    event.data.reviews_allowed = product.reviews_allowed;
    event.data.attributes = [];
    for (let attribute of product.attributes) {
      event.data.attributes.push({
        name: attribute.name,
        visible: attribute.visible,
        variation: attribute.variation,
        options: attribute.options
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

  private attributes(product: any) {
    return { id: product.id };
  }
}
