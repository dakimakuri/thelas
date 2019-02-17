import { Plugin } from '../plugin';
import { File } from './file';

export class FS extends Plugin {
  constructor() {
    super('fs')
    this.addResource('file', File);
  }
}
