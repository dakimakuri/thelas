import { Product } from './shopify';
import { File } from './file';
import { Resource } from './resource';
const chalk = require('chalk');

export class ResourceGroup {
  public state: any = {};

  async diff(resources: any) {
    let updates: any[] = [];
    let resourceTypes = { File: File, Product: Product };
    let found = [];
    for (let name in resources) {
      let type = name.substr(0, name.indexOf('.'));
      found.push(name);
      updates.push({
        resource: new Resource(resourceTypes[type], name),
        data: resources[name],
        name
      });
    }
    for (let key in this.state) {
      if (found.indexOf(key) === -1) {
        let type = key.substr(0, key.indexOf('.'));
        let name = key.substr(key.indexOf('.') + 1);
        updates.push({
          resource: new Resource(resourceTypes[type], name),
          data: null,
          name: key
        });
      }
    }
    for (let update of updates) {
      if (this.state[update.name]) {
        update.resource.state = this.state[update.name];
      }
      await update.resource.sync();
      update.diff = update.resource.diff(update.data);
    }
    return updates;
  }

  async apply(updates: any[]) {
    for (let update of updates) {
      if (update.diff.different) {
        console.log(`Updating ${update.name}...`);
        await update.resource.apply(update.diff);
        if (update.resource.state.data == null) {
          delete this.state[update.name];
        } else {
          this.state[update.name] = update.resource.state;
        }
      }
    }
  }
}
