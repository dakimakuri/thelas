import { Plugin } from '../plugin';
import { TestResource } from './test.resource';

export class NullPlugin extends Plugin {
  constructor() {
    super('null');
    this.addResource('test', TestResource);
  }
}
