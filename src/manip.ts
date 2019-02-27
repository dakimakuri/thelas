import * as _ from 'lodash';

export function type(o: any) {
  if (o === undefined) {
      return 'undefined';
  } else if (o === null) {
      return 'null';
  } else if (o instanceof Array) {
      return 'array';
  } else if (o instanceof Object) {
      return 'object';
  } else {
      return typeof o;
  }
}

export async function iterateObject(obj: any, fn: any, path: string[] = []) {
  if (obj instanceof Function) {
    return await fn(obj, path);
  } else if (obj instanceof Array) {
    for (let i = 0; i < obj.length; ++i) {
      obj[i] = await iterateObject(obj[i], fn, _.concat(path, String(i)));
    }
  } else if (obj instanceof Object) {
    for (let key in obj) {
      obj[key] = await iterateObject(obj[key], fn, _.concat(path, key));
    }
  }
  return await fn(obj, path);
}
