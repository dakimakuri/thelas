import { Plugin } from '../plugin';
import { Product } from './product';

export class DShipChina extends Plugin {
  constructor() {
    super('dshipchina')
    this.addResource('product', Product);
  }
}
