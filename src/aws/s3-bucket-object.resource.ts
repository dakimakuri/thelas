import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { Resource, ResourceCreateEvent, ResourceUpdateEvent, ResourceDestroyEvent, ResourceSyncEvent } from '../resource';
import * as AWS from 'aws-sdk';

const apiVersion = '2006-03-01';

export class S3BucketObjectResource extends Resource {
  constructor(name: string) {
    super(name, {
      type: 'object',
      properties: {
        bucket: {
          type: 'string',
          required: true,
          fragile: true
        },
        key: {
          type: 'string',
          allowNull: true,
          fragile: true
        },
        contents: {
          type: 'string',
          required: true
        }
      }
    }, {
      providers: {
        aws: 'aws'
      }
    });
  }

  async create(event: ResourceCreateEvent) {
    const aws = this.providers['aws'];
    const s3 = new AWS.S3({
      apiVersion,
      accessKeyId: aws.access_key,
      secretAccessKey: aws.secret_key,
      region: aws.region
    });
    const params = {
      Bucket: event.data.bucket,
      Key: event.data.key,
      Body: event.data.contents
    };
    await s3.putObject(params).promise();
    return event.data;
  }

  async update(event: ResourceUpdateEvent) {
    const aws = this.providers['aws'];
    const s3 = new AWS.S3({
      apiVersion,
      accessKeyId: aws.access_key,
      secretAccessKey: aws.secret_key,
      region: aws.region
    });
    const params = {
      Bucket: event.data.bucket,
      Key: event.data.key,
      Body: event.data.contents
    };
    await s3.putObject(params).promise();
    return event.data;
  }

  async destroy(event: ResourceDestroyEvent) {
    const aws = this.providers['aws'];
    const s3 = new AWS.S3({
      apiVersion,
      accessKeyId: aws.access_key,
      secretAccessKey: aws.secret_key,
      region: aws.region
    });
    const params = {
      Bucket: event.data.bucket,
      Key: event.data.key
    };
    await s3.deleteObject(params).promise();
  }

  async sync(event: ResourceSyncEvent) {
    const aws = this.providers['aws'];
    const s3 = new AWS.S3({
      apiVersion,
      accessKeyId: aws.access_key,
      secretAccessKey: aws.secret_key,
      region: aws.region
    });
    const params = {
      Bucket: event.data.bucket,
      Key: event.data.key
    };
    let result = await s3.getObject(params).promise();
    event.data.contents = result.Body.toString();
    return event.data;
  }

  async import(id: string) {
    const index = id.indexOf('.');
    if (index === -1) {
      throw new Error('Invalid id: ' + id);
    }
    const bucket = id.substr(0, index);
    const key = id.substr(index + 1);
    const aws = this.providers['aws'];
    const s3 = new AWS.S3({
      apiVersion,
      accessKeyId: aws.access_key,
      secretAccessKey: aws.secret_key,
      region: aws.region
    });
    const params = {
      Bucket: bucket,
      Key: key,
    };
    let result = await s3.getObject(params).promise();
    return {
      data: {},
      attributes: {
        bucket,
        key,
        contents: result.Body.toString()
      }
    };
  }
}
