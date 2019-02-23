import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { Resource } from '../resource';
import { getProducts } from './shopify.plugin';
import { ShopifyProvider } from './shopify.provider';

export class ProductImageResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
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
      }
    }, {
      providers: {
        shopify: ShopifyProvider
      }
    });
  }

  async create(event: any) {
    let shopify = this.providers['shopify'];
    let data = this.translate(event.data, event.attributes);
    let image = JSON.parse(await request.post(`https://${shopify.shop}.myshopify.com/admin/products/${event.data.product_id}/images.json`, {
      auth: {
        user: shopify.api_key,
        pass: shopify.password,
        sendImmediately: false
      },
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        image: data
      })
    })).image;
    return this.attributes(image);
  }

  async update(event: any) {
    let shopify = this.providers['shopify'];
    let data = this.translate(event.to, event.attributes);
    let image = JSON.parse(await request.put(`https://${shopify.shop}.myshopify.com/admin/products/${event.to.product_id}/images/${event.attributes.id}.json`, {
      auth: {
        user: shopify.api_key,
        pass: shopify.password,
        sendImmediately: false
      },
      headers: {
          'content-type': 'application/json',
      },
      body: JSON.stringify({
        image: data
      })
    })).image;
    return this.attributes(image);
  }

  async destroy(event: any) {
    let shopify = this.providers['shopify'];
    JSON.parse(await request.delete(`https://${shopify.shop}.myshopify.com/admin/products/${event.oldData.product_id}/images/${event.attributes.id}.json`, {
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

  import(id: string) {
    throw new Error('NYI');
  }

  private translate(data: any, attributes: any) {
    data = _.clone(data);
    if (attributes) {
      data.id = attributes.id;
    }
    return data;
  }

  private attributes(image: any) {
    return {
      id: image.id
    };
  }
}
