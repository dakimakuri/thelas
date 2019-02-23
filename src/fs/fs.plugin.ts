import { Plugin } from '../plugin';
import { FileResource } from './file.resource';

export class FSPlugin extends Plugin {
  constructor() {
    super('fs')
    this.addResource('file', FileResource);
  }
}
