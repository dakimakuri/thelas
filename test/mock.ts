import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { Plugin, ResourceGroup, Resource } from '../src';

let active: MockPlugin = null;

export class MockPlugin extends Plugin {
  public data: any = {
    resources: {}
  };

  constructor() {
    super('mock');
    this.addResource('resource', MockResource);
    active = this;
  }
}

export class MockResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          required: true,
          fragile: true
        }
      }
    });
  }

  async create(event: any) {
    active.data.resources[event.data.name] = {
      name: event.data.name
    };
    return {
      text: event.data,
      stuff: [ 1, 2, 3 ]
    };
  }

  async update(event: any) {
    return {
      text: event.data,
      stuff: [ 1, 2, 3 ]
    };
  }

  async destroy(event: any) {
    delete active.data.resources[event.oldData.name];
  }

  async sync(data: any) {
    return data;
  }
}

function checkMock(name: string) {
  it('mock test: ' + name, async () => {
    let mock = new MockPlugin();
    let group = new ResourceGroup();
    group.addPlugin(mock);
    let inputs = await fs.readJson(`./test/mock/${name}.json`);
    let output = await fs.readJson(`./test/mock/${name}.out.json`);
    for (let input of inputs) {
      await group.apply(await group.diff(input));
    }
    if (!_.isEqual(mock.data, output)) {
      throw new Error('Failed!');
    }
  });
}

var assert = require('assert');
describe('Mock Tests', function() {
  for (let file of fs.readdirSync('./test/mock')) {
    if (file.endsWith('.json')) {
      try {
        fs.statSync('./test/mock/' + file.substr(0, file.length - 5) + '.out.json');
        checkMock(file.substr(0, file.length - 5));
      } catch (err) {
      }
    }
  }
});
