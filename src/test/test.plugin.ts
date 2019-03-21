import { Plugin } from '../plugin';
import { NullResource } from './null.resource';
import { TraceResource } from './trace.resource';
import { TestProvider } from './test.provider';

export class TestPlugin extends Plugin {
  public logs: string[] = [];

  constructor() {
    super('test')
    this.addResource('null', NullResource);
    this.addResource('trace', TraceResource);
    this.addProvider('test', TestProvider);
  }

  createResource(type: string, name: string) {
    let resource = this.resources[type];
    if (resource) {
      if (resource === TraceResource) {
        return new resource(this, name);
      }
      return new resource(name);
    }
    return null;
  }
}
