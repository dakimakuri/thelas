import { Plugin } from '../plugin';
import { ChannelResource } from './channel.resource';
import { RoleResource } from './role.resource';
import { MessageResource } from './message.resource';
import { DiscordProvider } from './discord.provider';

export class DiscordPlugin extends Plugin {
  constructor() {
    super('aws')
    this.addResource('channel', ChannelResource);
    this.addResource('role', RoleResource);
    this.addResource('message', MessageResource);
    this.addProvider('discord', DiscordProvider);
  }
}
