import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent, ResourceSyncEvent } from '../resource';

export class FileResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          fragile: true,
          required: true
        },
        contents: {
          type: 'string',
          default: '',
          attributes: [
            'filename',
            'contents',
            'mtime',
            'size'
          ]
        }
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    await fs.writeFile(event.data.filename, event.data.contents);
    return await this.attributes(event.data);
  }

  async update(event: ResourceUpdateEvent) {
    if (_.find(event.changes, { path: 'contents' })) {
      await fs.writeFile(event.data.filename, event.data.contents);
    }
    return await this.attributes(event.data);
  }

  async destroy(event: ResourceDestroyEvent) {
    await fs.unlink(event.data.filename);
  }

  async sync(event: ResourceSyncEvent) {
    if (event.data == null) return;
    try {
      event.data.contents = (await fs.readFile(event.data.filename)).toString();
    } catch (err) {
      return null;
    }
    return event.data;
  }

  async import(id: string) {
    let data: any = {
      filename: id
    };
    await fs.stat(id);
    data = await this.sync(data);
    let attributes = await this.attributes(data);
    return { data, attributes };
  }

  private async attributes(data: any) {
    let stat = await fs.stat(data.filename);
    return {
      filename: data.filename,
      contents: data.contents,
      atime: stat.atime,
      mtime: stat.mtime,
      ctime: stat.ctime,
      size: stat.size
    };
  }
}
