import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent, ResourceSyncEvent } from '../resource';
import * as _ from 'lodash';

export class ChannelResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        guild: {
          type: 'string',
          required: true,
          fragile: true
        },
        name: {
          type: 'string',
          required: true
        },
        nsfw: {
          type: 'boolean',
          default: false
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
    let channel = await guild.createChannel(event.data.name);
    if (event.data.nsfw) {
      await channel.setNSFW(true);
    }
    return {
      id: channel.id
    };
  }

  async update(event: ResourceUpdateEvent) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(event.data.guild);
    let channel = await guild.channels.get(event.attributes.id);
    if (_.find(event.changes, { path: 'name' })) {
      await channel.setName(event.data.name);
    }
    if (_.find(event.changes, { path: 'nsfw' })) {
      await channel.setNSFW(event.data.nsfw);
    }
    return {
      id: channel.id
    };
  }

  async destroy(event: ResourceDestroyEvent) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(event.data.guild);
    let channel = await guild.channels.get(event.attributes.id);
    if (!channel) {
      throw new Error('Failed to find Discord channel: ' + event.attributes.id);
    }
    await channel.delete();
  }

  async sync(event: ResourceSyncEvent) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(event.data.guild);
    let channel = await guild.channels.get(event.attributes.id);
    if (!channel) {
      return null;
    }
    event.data.name = channel.name;
    event.data.nsfw = channel.nsfw;
    return event.data;
  }

  async import(id: string) {
    throw new Error('NYI');
  }
}
