import { Plugin } from '../plugin';
import { TestResource } from './test.resource';
import { Test2Resource } from './test2.resource';
import { NullProvider } from './null.provider';

export class NullPlugin extends Plugin {
  constructor() {
    super('null');
    this.addResource('test', TestResource);
    this.addResource('test2', Test2Resource);
    this.addProvider('null', NullProvider);
  }
}
