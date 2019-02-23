import { Plugin } from '../plugin';
import { ProductResource } from './product.resource';

export class DShipChinaPlugin extends Plugin {
  constructor() {
    super('dshipchina')
    this.addResource('product', ProductResource);
  }
}
