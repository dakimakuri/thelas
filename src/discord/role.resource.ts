import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent, ResourceSyncEvent } from '../resource';
import * as _ from 'lodash';

export class RoleResource extends Resource {
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
        color: {
          type: 'string',
          default: '#000000'
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
    let role = await guild.createRole({ name: event.data.name, color: event.data.color });
    return {
      id: role.id
    };
  }

  async update(event: ResourceUpdateEvent) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(event.data.guild);
    let role = await guild.roles.get(event.attributes.id);
    if (_.find(event.changes, { path: 'name' })) {
      await role.setName(event.data.name);
    }
    if (_.find(event.changes, { path: 'color' })) {
      await role.setColor(event.data.color);
    }
    return {
      id: role.id
    };
  }

  async destroy(event: ResourceDestroyEvent) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(event.data.guild);
    let role = await guild.roles.get(event.attributes.id);
    if (!role) {
      throw new Error('Failed to find Discord role: ' + event.attributes.id);
    }
    await role.delete();
  }

  async sync(event: ResourceSyncEvent) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(event.data.guild);
    let role = await guild.roles.get(event.attributes.id);
    if (!role) {
      return null;
    }
    event.data.name = role.name;
    event.data.color = role.hexColor;
    return event.data;
  }

  async import(id: string) {
    throw new Error('NYI');
  }
}
