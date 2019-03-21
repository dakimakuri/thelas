import { Plugin } from '../plugin';
import { ProductResource } from './product.resource';
import { DShipChinaProvider } from './dshipchina.provider';

export class DShipChinaPlugin extends Plugin {
  constructor() {
    super('dshipchina')
    this.addResource('product', ProductResource);
    this.addProvider('dshipchina', DShipChinaProvider);
  }
}
