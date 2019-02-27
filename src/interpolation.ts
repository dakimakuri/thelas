import { type, iterateObject } from './manip';
import * as _ from 'lodash';
import * as md5 from 'md5';
import * as fs from 'fs';

type InterpolatorPreprocess = any;
type InterpolatorFunction = any;
export class Interpolator {
  private pres = new Map<string, InterpolatorPreprocess>();
  private ops = new Map<string, InterpolatorFunction>();

  constructor() {
    this.op('_add', _.spread(_.add));
    this.op('_ceil', _.spread(_.ceil));
    this.op('_divide', _.spread(_.divide));
    this.op('_floor', _.spread(_.floor));
    this.op('_max', _.spread(_.max));
    this.op('_maxBy', _.spread(_.maxBy));
    this.op('_mean', _.spread(_.mean));
    this.op('_meanBy', _.spread(_.meanBy));
    this.op('_min', _.spread(_.min));
    this.op('_minBy', _.spread(_.minBy));
    this.op('_multiply', _.spread(_.multiply));
    this.op('_round', _.spread(_.round));
    this.op('_subtract', _.spread(_.subtract));
    this.op('_sum', _.spread(_.sum));
    this.op('_sumBy', _.spread(_.sumBy));

    this.op('_clamp', _.spread(_.clamp));
    this.op('_inRange', _.spread(_.inRange));
    this.op('_random', _.spread(_.random));

    this.op('_camelCase', _.spread(_.camelCase));
    this.op('_capitalize', _.spread(_.capitalize));
    this.op('_deburr', _.spread(_.deburr));
    this.op('_endsWith', _.spread(_.endsWith));
    this.op('_escape', _.spread(_.escape));
    this.op('_kebabCase', _.spread(_.kebabCase));
    this.op('_lowerCase', _.spread(_.lowerCase));
    this.op('_lowerFirst', _.spread(_.lowerFirst));
    this.op('_pad', _.spread(_.pad));
    this.op('_padEnd', _.spread(_.padEnd));
    this.op('_padStart', _.spread(_.padStart));
    this.op('_parseInt', _.spread(_.parseInt));
    this.op('_repeat', _.spread(_.repeat));
    this.op('_replace', _.spread(_.replace));
    this.op('_snakeCase', _.spread(_.snakeCase));
    this.op('_split', _.spread(_.split));
    this.op('_startCase', _.spread(_.startCase));
    this.op('_startsWith', _.spread(_.startsWith));
    this.op('_template', _.spread(_.template));
    this.op('_toLower', _.spread(_.toLower));
    this.op('_trim', _.spread(_.trim));
    this.op('_trimEnd', _.spread(_.trimEnd));
    this.op('_trimStart', _.spread(_.trimStart));
    this.op('_truncate', _.spread(_.truncate));
    this.op('_unescape', _.spread(_.unescape));
    this.op('_upperCase', _.spread(_.upperCase));
    this.op('_upperFirst', _.spread(_.upperFirst));
    this.op('_words', _.spread(_.words));

    this.op('stringify', (o: any) => JSON.stringify(o, null, 2));
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
      return await md5(fs.readFileSync(o));
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
