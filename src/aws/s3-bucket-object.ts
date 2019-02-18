import * as request from 'request-promise-native';
import * as _ from 'lodash';
import { Resource } from '../resource';
import { AWSProvider } from './aws.provider';
import * as AWS from 'aws-sdk';

const apiVersion = '2006-03-01';

export class S3BucketObject extends Resource {

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
        aws: AWSProvider
      }
    });
  }

  async create(event: any) {
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

  async update(event: any) {
    const aws = this.providers['aws'];
    const s3 = new AWS.S3({
      apiVersion,
      accessKeyId: aws.access_key,
      secretAccessKey: aws.secret_key,
      region: aws.region
    });
    const params = {
      Bucket: event.to.bucket,
      Key: event.to.key,
      Body: event.to.contents
    };
    await s3.putObject(params).promise();
    return event.to;
  }

  async destroy(event: any) {
    const aws = this.providers['aws'];
    const s3 = new AWS.S3({
      apiVersion,
      accessKeyId: aws.access_key,
      secretAccessKey: aws.secret_key,
      region: aws.region
    });
    const params = {
      Bucket: event.oldData.bucket,
      Key: event.oldData.key
    };
    await s3.deleteObject(params).promise();
  }

  async sync(data: any, attributes: any) {
    const aws = this.providers['aws'];
    const s3 = new AWS.S3({
      apiVersion,
      accessKeyId: aws.access_key,
      secretAccessKey: aws.secret_key,
      region: aws.region
    });
    const params = {
      Bucket: data.bucket,
      Key: data.key
    };
    let result = await s3.getObject(params).promise();
    data.contents = result.Body.toString();
    return data;
  }
}
