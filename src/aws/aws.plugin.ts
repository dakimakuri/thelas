import { Plugin } from '../plugin';
import { S3BucketObjectResource } from './s3-bucket-object.resource';
import { AWSProvider } from './aws.provider';

export class AWSPlugin extends Plugin {
  constructor() {
    super('aws')
    this.addResource('s3-bucket-object', S3BucketObjectResource);
    this.addProvider('aws', S3BucketObjectResource);
  }
}
