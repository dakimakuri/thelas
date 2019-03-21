import { Provider } from '../provider';
import { TestPlugin } from './test.plugin';

export class TestProvider extends Provider {
  constructor(private name: string, private plugin: TestPlugin) {
    super('test', {
      type: 'object',
      additionalProperties: false,
      properties: {
        tag: {
          type: 'string'
        }
      },
      required: ['tag']
    }, {
      tag: ''
    });
  }

  async init(data: any) {
    if (data.tag !== '') {
      data.tag = '-' + data.tag;
    }
    this.plugin.logs.push(`init.${this.name}${data.tag}`);
  }

  async cleanup(data: any) {
    this.plugin.logs.push(`cleanup.${this.name}${data.tag}`);
  }
}
