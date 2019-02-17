import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { key } from './auth';

export namespace Product {
  export const args = {
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
      type: 'string',
      allowNull: true
    },
  };

  export async function create(event: any) {
    return attributes((await req('createproduct', event.data, event.attributes)));
  }

  export async function update(event: any) {
    if (event.from.note && !event.to.note) {
      event.to.note = '';
    }
    if (event.from.declared_value && !event.to.declared_value) {
      event.to.declared_value = '0.00';
    }
    if (event.from.declared_name && !event.to.declared_name) {
      event.to.declared_name = '';
    }
    await req('editproduct', event.to, event.attributes);
    return event.attributes;
  }

  export async function destroy(event: any) {
    throw new Error('Cannot destroy DShipChina products. You must do this manually.');
  }

  export async function sync(data: any, attributes: any) {
    try {
      let product = (await req('getaproduct', data, attributes)).product;
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
      if (product.declare_value !== '0.00' || !!data.declared_value) {
        data.declared_value = product.declare_value;
      } else {
        data.declared_value = '';
      }
      if (product.declare_name !== '0' || !!data.declared_name) {
        data.declared_name = product.declare_name;
      } else {
        data.declared_name = '';
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  async function req(route: string, data: any, attributes: any): Promise<any> {
    let url = `https://www.dshipchina.com/api1/${route}.php`;
    url += '?key=' + encodeURIComponent(key);
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

  function attributes(product: any) {
    return {
      product_id: product.product_id
    };
  }
}
