import * as _ from 'lodash';
import { Module } from './module';

export class Null extends Module {
  constructor() {
    super('null');
    this.addResource('test', Test);
  }
}

export namespace Test {
  export const args = {
    text: {
      type: 'string',
      required: true,
      attributes: [ 'text' ]
    }
  };

  export async function create(event: any) {
    console.log('Create:', event.data.text);
    console.log();
    return {
      text: event.data,
      stuff: [ 1, 2, 3 ]
    };
  }

  export async function update(event: any) {
    console.log('Update:', event.to.text);
    console.log();
    return {
      text: event.data,
      stuff: [ 1, 2, 3 ]
    };
  }

  export async function destroy(event: any) {
    console.log('Destroy:', event.oldData.text);
    console.log();
  }

  export async function sync(data: any) {
    return data;
  }
}
