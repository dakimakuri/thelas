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
        },
        properties: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              required: true
            },
            key: {
              type: 'string',
              required: true
            }
          }
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
            required: true
          },
          default: []
        }
      }
    });
  }

  async create(event: any) {
    active.data.resources[event.data.name] = {
      name: event.data.name,
      properties: event.data.properties,
      tags: event.data.tags
    };
    return {
      tags: event.data.tags
    };
  }

  async update(event: any) {
    active.data.resources[event.data.name] = {
      name: event.data.name,
      properties: event.data.properties,
      tags: event.data.tags
    };
    return {
      tags: event.data.tags
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
    let test = await fs.readJson(`./mock/${name}.json`);
    let inputs = test.inputs;
    let output = test.output;
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
  for (let file of fs.readdirSync('./mock')) {
    if (file.endsWith('.json')) {
      try {
        checkMock(file.substr(0, file.length - 5));
      } catch (err) {
      }
    }
  }
});
