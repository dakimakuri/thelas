import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent, ResourceSyncEvent } from '../resource';

let productCache: any = {};
export async function getProducts(key: string): Promise<any> {
  if (!productCache[key]) {
    productCache[key] = JSON.parse(await request.get('https://www.dshipchina.com/api1/getallproducts.php?key=' + encodeURIComponent(key))).products;
  }
  return productCache[key];
}

export class ProductResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        product_name: {
          type: 'string',
          allowNull: true
        },
        note: {
          type: 'string',
          allowNull: true
        },
        declared_name: {
          type: 'string',
          allowNull: true
        },
        declared_value: {
          type: 'number',
          allowNull: true
        }
      }
    }, {
      providers: {
        dshipchina: 'dshipchina'
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    return this.attributes((await this.req('createproduct', event.data, event.attributes)));
  }

  async update(event: ResourceUpdateEvent) {
    if (event.from.note && !event.data.note) {
      event.data.note = '';
    }
    if (event.from.declared_value && !event.data.declared_value) {
      event.data.declared_value = 0;
    }
    if (event.from.declared_name && !event.data.declared_name) {
      event.data.declared_name = '';
    }
    await this.req('editproduct', event.data, event.attributes);
    return event.attributes;
  }

  async destroy(event: ResourceDestroyEvent) {
    throw new Error('Cannot destroy DShipChina products. You must do this manually.');
  }

  async sync(event: ResourceSyncEvent) {
    let dshipchina = this.providers['dshipchina'];
    let products = await getProducts(dshipchina.key);
    //let product = (await req('getaproduct', event.data, event.attributes)).product;
    let product = _.find(products, { product_id: event.attributes.product_id }) as any;
    if (!product) return null;
    if (product.product_name !== '0' || !!event.data.product_name) {
      event.data.product_name = product.product_name;
    } else {
      event.data.product_name = '';
    }
    if (product.note !== '0' || !!event.data.note) {
      event.data.note = product.note;
    } else {
      event.data.note = '';
    }
    if (product.declare_value !== '0.00' || (!!event.data.declared_value && event.data.declared_value !== '0.00')) {
      event.data.declared_value = Number(product.declare_value);
    } else {
      event.data.declared_value = null;
    }
    if (product.declare_name !== '0' || !!event.data.declared_name) {
      event.data.declared_name = product.declare_name;
    } else {
      event.data.declared_name = '';
    }
    return event.data;
  }

  async import(id: string) {
    id = String(id);
    let dshipchina = this.providers['dshipchina'];
    let products = await getProducts(dshipchina.key);
    let product = _.find(products, { product_id: id }) as any;
    if (!product) throw new Error('Failed to import ID: ' + id);
    return {
      data: {},
      attributes: {
        product_id: id
      }
    };
  }

  private async req(route: string, data: any, attributes: any): Promise<any> {
    let dshipchina = this.providers['dshipchina'];
    let url = `https://www.dshipchina.com/api1/${route}.php`;
    url += '?key=' + encodeURIComponent(dshipchina.key);
    if (route === 'editproduct' || route === 'getaproduct') {
      url += '&product_id=' + encodeURIComponent(attributes.product_id);
    }
    if (route === 'editproduct' || route === 'createproduct') {
      url += '&product_name=' + encodeURIComponent(data.product_name);
      if (data.note != null) {
        url += '&note=' + encodeURIComponent(data.note);
      }
      if (data.declared_name != null) {
        url += '&declared_name=' + encodeURIComponent(data.declared_name);
      }
      if (data.declared_value != null) {
        url += '&declared_value=' + encodeURIComponent(data.declared_value);
      }
    }
    let result = JSON.parse(await request.get(url));
    if (result.status != 200) {
      throw new Error('DShipChina returned status ' + result.status);
    }
    return result;
  }

  private attributes(product: any) {
    return {
      product_id: product.product_id
    };
  }
}
