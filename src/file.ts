import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { Plugin } from './plugin';

export class FS extends Plugin {
  constructor() {
    super('fs');
    this.addResource('file', File);
  }
}

export namespace File {
  export const args = {
    filename: {
      type: 'string',
      fragile: true,
      required: true
    },
    contents: {
      type: 'string',
      default: ''
    }
  };

  export async function create(event: any) {
    await fs.writeFile(event.data.filename, event.data.contents);
    return await attributes(event.data);
  }

  export async function update(event: any) {
    if (_.find(event.changes, { path: 'contents' })) {
      await fs.writeFile(event.to.filename, event.to.contents);
    }
    return await attributes(event.to);
  }

  export async function destroy(event: any) {
    await fs.unlink(event.oldData.filename);
  }

  export async function sync(data: any) {
    if (data == null) return;
    try {
      data.contents = (await fs.readFile(data.filename)).toString();
    } catch (err) {
      return null;
    }
    return data;
  }

  async function attributes(data: any) {
    let stat = await fs.stat(data.filename);
    return {
      filename: path.isAbsolute(data.filename) ? data.filename : path.join(process.cwd(), data.filename),
      contents: data.contents,
      atime: stat.atime,
      mtime: stat.mtime,
      ctime: stat.ctime,
      size: stat.size
    };
  }
}
