import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent } from '../resource';
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
    let guild = client.guilds.get(event.to.guild);
    let role = await guild.roles.get(event.attributes.id);
    if (_.find(event.changes, { path: 'name' })) {
      await role.setName(event.to.name);
    }
    if (_.find(event.changes, { path: 'color' })) {
      await role.setColor(event.to.color);
    }
    return {
      id: role.id
    };
  }

  async destroy(event: ResourceDestroyEvent) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(event.oldData.guild);
    let role = await guild.roles.get(event.attributes.id);
    if (!role) {
      throw new Error('Failed to find Discord role: ' + event.attributes.id);
    }
    await role.delete();
  }

  async sync(data: any, attributes: any) {
    let client = this.providers['bot'].client;
    let guild = client.guilds.get(data.guild);
    let role = await guild.roles.get(attributes.id);
    if (!role) {
      return null;
    }
    data.name = role.name;
    data.color = role.hexColor;
    return data;
  }

  async import(id: string) {
    throw new Error('NYI');
  }
}
