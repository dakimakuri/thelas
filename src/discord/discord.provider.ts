import { Provider } from '../provider';
import * as Discord from 'discord.js';

export class DiscordProvider extends Provider {
  constructor() {
    super('aws', {
      type: 'object',
      additionalProperties: false,
      properties: {
        token: {
          type: 'string'
        }
      },
      required: ['token']
    });
  }

  init(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      data.client = new Discord.Client();
      data.client.on('ready', () => {
        resolve();
      });
      data.client.on('error', reject);
      data.client.login(data.token);
    });
  }

  async cleanup(data: any) {
    await data.client.destroy();
  }
}
