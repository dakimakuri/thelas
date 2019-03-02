import { type, iterateObject } from './manip';
import * as _ from 'lodash';
import * as md5 from 'md5';
import * as fs from 'fs-extra';

type InterpolatorPreprocess = any;
type InterpolatorFunction = any;
export class Interpolator {
  private pres = new Map<string, InterpolatorPreprocess>();
  private ops = new Map<string, InterpolatorFunction>();

  constructor() {
    // function expects a single argument
    const singleArg = (fn: any) => fn;
    // function expects 0, 1 or many arguments
    const optionalArgs = (fn: any) => {
      return function (input: any) {
        if (input instanceof Array) {
          return fn.apply(this, input);
        } else {
          return fn(input);
        }
      }
    };
    // function expects 2+ arguments
    const multiArgs = _.spread;

    // functionify
    this.op('fn', (v: any) => () => v);

    // math
    this.op('add',      optionalArgs(_.add));
    this.op('ceil',     optionalArgs(_.ceil));
    this.op('divide',   optionalArgs(_.divide));
    this.op('floor',    optionalArgs(_.floor));
    this.op('max',      singleArg(_.max));
    this.op('maxBy',    multiArgs(_.maxBy));
    this.op('mean',     singleArg(_.mean));
    this.op('meanBy',   multiArgs(_.meanBy));
    this.op('min',      singleArg(_.min));
    this.op('minBy',    multiArgs(_.minBy));
    this.op('multiply', optionalArgs(_.multiply));
    this.op('round',    optionalArgs(_.round));
    this.op('subtract', optionalArgs(_.subtract));
    this.op('sum',      singleArg(_.sum));
    this.op('sumBy',    multiArgs(_.sumBy));

    // number
    this.op('clamp',   multiArgs(_.clamp));
    this.op('inRange', multiArgs(_.inRange));

    // string
    this.op('camelCase',  singleArg(_.camelCase));
    this.op('capitalize', singleArg(_.capitalize));
    this.op('deburr',     singleArg(_.deburr));
    this.op('endsWith',   multiArgs(_.endsWith));
    this.op('escape',     singleArg(_.escape));
    this.op('kebabCase',  singleArg(_.kebabCase));
    this.op('lowerCase',  singleArg(_.lowerCase));
    this.op('lowerFirst', singleArg(_.lowerFirst));
    this.op('pad',        optionalArgs(_.pad));
    this.op('padEnd',     optionalArgs(_.padEnd));
    this.op('padStart',   optionalArgs(_.padStart));
    this.op('parseInt',   optionalArgs(_.parseInt));
    this.op('repeat',     optionalArgs(_.repeat));
    this.op('replace',    multiArgs(_.replace));
    this.op('snakeCase',  singleArg(_.snakeCase));
    this.op('split',      optionalArgs(_.split));
    this.op('startCase',  singleArg(_.startCase));
    this.op('startsWith', optionalArgs(_.startsWith));
    this.op('toLower',    singleArg(_.toLower));
    this.op('toUpper',    singleArg(_.toUpper));
    this.op('trim',       optionalArgs(_.trim));
    this.op('trimEnd',    optionalArgs(_.trimEnd));
    this.op('trimStart',  optionalArgs(_.trimStart));
    this.op('truncate',   optionalArgs(_.truncate));
    this.op('unescape',   singleArg(_.unescape));
    this.op('upperCase',  singleArg(_.upperCase));
    this.op('upperFirst', singleArg(_.upperFirst));
    this.op('words',      optionalArgs(_.words));

    // lodash templates
    this.op('template', optionalArgs((str: string, data: any) => _.template(str)(data)));

    this.op('stringify', (o: any) => JSON.stringify(o, null, 2));
    this.op('jsonStringify', (o: any) => JSON.stringify(o));
    this.op('findBy', (o: any) => {
      let collection = o.collection;
      let key = o.key;
      let value = o.value;
      let prop = o.prop;
      let predicate: any = {};
      predicate[key] = value;
      let f = _.find(collection, predicate);
      if (prop) {
        return f[prop];
      } else {
        return f;
      }
    });
    this.op('md5', async (o: any) => {
      return await md5(o);
    });
    this.op('file', async (o: any) => {
      return (await fs.readFile(o)).toString();
    });
  }

  pre(name: string, op: InterpolatorPreprocess) {
    this.pres.set(name, op);
  }

  op(name: string, op: InterpolatorFunction) {
    this.ops.set(name, op);
  }

  async preprocess(obj: any, context: any = {}) {
    return await iterateObject(obj, async (o: any, path: string) => {
      if (type(o) === 'object') {
        let resolve = false;
        let op: string | undefined;
        for (let key in o) {
          if (key.startsWith('$')) {
            if (op) {
              throw new Error('Cannot have multiple operations in block: ' + op + ' & ' + key);
            }
            op = key;
          }
        }
        if (op) {
          let fn = this.pres.get(op.substr(1));
          if (fn) {
            o[op] = await fn(o[op], path, context);
            return o;
          }
        }
      }
      return o;
    });
  }

  async process(obj: any) {
    return await iterateObject(obj, async (o: any, path: string) => {
      if (type(o) === 'object') {
        let res = o;
        let resolve = false;
        let op: string | undefined;
        for (let key in o) {
          if (key.startsWith('$')) {
            if (op) {
              throw new Error('Cannot have multiple operations in block: ' + op + ' & ' + key);
            }
            op = key;
          }
        }
        if (op) {
          let fn = this.ops.get(op.substr(1));
          if (!fn) {
            throw new Error('Invalid operation: ' + op);
          }
          let interp = !(await Interpolator.done(o[op]));
          if (interp) {
            return async () => {
              return await fn(await Interpolator.postprocess(o[op]));
            };
          } else {
            return await fn(o[op]);
          }
        }
        return res;
      }
      return o;
    });
  }

  static async postprocess(obj: any) {
    return await iterateObject(obj, async (o: any) => {
      if (o instanceof Function) {
        return await o();
      }
      return o;
    });
  }

  static async done(obj: any) {
    let done = true;
    await iterateObject(obj, (o: any) => {
      if (o instanceof Function) {
        done = false;
      }
      return o;
    });
    return done;
  }
}
