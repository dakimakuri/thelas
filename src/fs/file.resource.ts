import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { Resource } from '../resource';

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
          default: ''
        }
      }
    });
  }

  async create(event: any) {
    await fs.writeFile(event.data.filename, event.data.contents);
    return await this.attributes(event.data);
  }

  async update(event: any) {
    if (_.find(event.changes, { path: 'contents' })) {
      await fs.writeFile(event.to.filename, event.to.contents);
    }
    return await this.attributes(event.to);
  }

  async destroy(event: any) {
    await fs.unlink(event.oldData.filename);
  }

  async sync(data: any) {
    if (data == null) return;
    try {
      data.contents = (await fs.readFile(data.filename)).toString();
    } catch (err) {
      return null;
    }
    return data;
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
