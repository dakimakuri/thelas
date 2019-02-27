declare let require: any;
import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent } from '../resource';
import { getProducts } from './shopify.plugin';
import { ShopifyProvider } from './shopify.provider';
const Jimp = require('jimp');

function getImageBase64(file) {
  return new Promise(async (resolve, reject) => {
    let jimp = await Jimp.read(file);
    jimp.getBase64(Jimp.MIME_PNG, (err, b64) => {
      if (err) return reject(err);
      let ind = b64.indexOf(',');
      if (ind != -1) {
        b64 = b64.substr(ind + 1);
      }
      resolve(b64);
    });
  });
}

export class ProductImageResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        product_id: {
          type: 'number',
          required: true
        },
        file: {
          type: 'string',
          required: true
        },
        hash: {
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

  async create(event: ResourceCreateEvent) {
    let shopify = this.providers['shopify'];
    let data = await this.translate(event.data, event.attributes);
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

  async update(event: ResourceUpdateEvent) {
    let shopify = this.providers['shopify'];
    let data = await this.translate(event.to, event.attributes);
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

  async destroy(event: ResourceDestroyEvent) {
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

  async import(id: string) {
    let index = id.indexOf('.');
    if (!index) {
      throw new Error('Invalid Shopify product image id: ' + id);
    }
    let productId = Number(id.substr(0, index));
    let imageId = Number(id.substr(index + 1));
    let shopify = this.providers['shopify'];
    let products = await getProducts(shopify);
    let product = _.find(products, { id: productId }) as any;
    if (!product) {
      throw new Error('Invalid Shopify product: ' + productId);
    }
    let image = _.find(product.images, { id: imageId }) as any;
    if (!image) {
      throw new Error('Invalid Shopify product image: ' + id);
    }
    return {
      data: {},
      attributes: {
        id: imageId
      }
    };
  }

  private async translate(data: any, attributes: any) {
    data = _.clone(data);
    if (attributes) {
      data.id = attributes.id;
    }
    data.attachment = await getImageBase64(data.file);
    delete data['file'];
    delete data['hash'];
    return data;
  }

  private attributes(image: any) {
    return {
      id: image.id
    };
  }
}
