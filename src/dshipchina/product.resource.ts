import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent } from '../resource';

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
    if (event.from.note && !event.to.note) {
      event.to.note = '';
    }
    if (event.from.declared_value && !event.to.declared_value) {
      event.to.declared_value = 0;
    }
    if (event.from.declared_name && !event.to.declared_name) {
      event.to.declared_name = '';
    }
    await this.req('editproduct', event.to, event.attributes);
    return event.attributes;
  }

  async destroy(event: ResourceDestroyEvent) {
    throw new Error('Cannot destroy DShipChina products. You must do this manually.');
  }

  async sync(data: any, attributes: any) {
    let dshipchina = this.providers['dshipchina'];
    let products = await getProducts(dshipchina.key);
    //let product = (await req('getaproduct', data, attributes)).product;
    let product = _.find(products, { product_id: attributes.product_id }) as any;
    if (!product) return null;
    if (product.product_name !== '0' || !!data.product_name) {
      data.product_name = product.product_name;
    } else {
      data.product_name = '';
    }
    if (product.note !== '0' || !!data.note) {
      data.note = product.note;
    } else {
      data.note = '';
    }
    if (product.declare_value !== '0.00' || (!!data.declared_value && data.declared_value !== '0.00')) {
      data.declared_value = Number(product.declare_value);
    } else {
      data.declared_value = null;
    }
    if (product.declare_name !== '0' || !!data.declared_name) {
      data.declared_name = product.declare_name;
    } else {
      data.declared_name = '';
    }
    return data;
  }

  async import(id: string) {
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
