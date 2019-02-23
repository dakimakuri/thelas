import { Plugin } from '../plugin';
import { Test } from './test.resource';

export class Null extends Plugin {
  constructor() {
    super('null');
    this.addResource('test', Test);
  }
}
