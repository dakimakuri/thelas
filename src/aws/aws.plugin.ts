import { Plugin } from '../plugin';
import { S3BucketObject } from './s3-bucket-object.resource';

export class AWS extends Plugin {
  constructor() {
    super('aws')
    this.addResource('s3-bucket-object', S3BucketObject);
  }
}
