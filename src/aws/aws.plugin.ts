import { Plugin } from '../plugin';
import { S3BucketObjectResource } from './s3-bucket-object.resource';

export class AWSPlugin extends Plugin {
  constructor() {
    super('aws')
    this.addResource('s3-bucket-object', S3BucketObjectResource);
  }
}
