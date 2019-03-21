import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent } from '../resource';
import * as _ from 'lodash';

export class MessageResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        guild: {
          type: 'string',
          required: true,
          fragile: true
        },
        channel: {
          type: 'string',
          required: true,
          fragile: true
        },
        message: {
          type: 'string',
          required: true
        }
      }
    }, {
      providers: {
        bot: 'discord'
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(event.data.guild);
    let channel = await guild.channels.get(event.data.channel);
    let message = _.concat(await channel.send(event.data.message));
    return {
      id: message[0].id
    };
  }

  async update(event: ResourceUpdateEvent) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(event.to.guild);
    let channel = await guild.channels.get(event.to.channel);
    let message = await channel.fetchMessage(event.attributes.id);
    await message.edit(event.to.message);
    return {
      id: message.id
    };
  }

  async destroy(event: ResourceDestroyEvent) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(event.oldData.guild);
    let channel = await guild.channels.get(event.oldData.channel);
    let message = await channel.fetchMessage(event.attributes.id);
    await message.delete();
  }

  async sync(data: any, attributes: any) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(data.guild);
    let channel = await guild.channels.get(data.channel);
    try {
      let message = await channel.fetchMessage(attributes.id);
      if (!message) {
        return null;
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  async import(id: string) {
    throw new Error('NYI');
  }
}
