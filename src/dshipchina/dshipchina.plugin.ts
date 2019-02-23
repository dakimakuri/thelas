import { Plugin } from '../plugin';
import { Product } from './product.resource';

export class DShipChina extends Plugin {
  constructor() {
    super('dshipchina')
    this.addResource('product', Product);
  }
}
