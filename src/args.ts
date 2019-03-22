import * as _ from 'lodash';
import { validate } from 'jsonschema';
import { type } from './manip';

function recursiveKeys(args: any, o: any, path: string[] = [], schemaPath: string[] = []) {
  let keys: any[] = [];
  let argInfo = _.get(args, schemaPath);
  let isJson = argInfo && argInfo.type === 'json';
  if (o instanceof Function) {
    if (path.length !== 0) {
      keys.push({ path: path.join('.'), schema: schemaPath.join('.') });
    }
  } else if (o instanceof Array) {
    for (let i = 0; i < o.length; ++i) {
      keys = _.concat(keys, recursiveKeys(args, o[i], _.concat(path, String(i)), _.concat(schemaPath, 'items')));
    }
  } else if (o instanceof Object && !isJson) {
    for (let k in o) {
      keys = _.concat(keys, recursiveKeys(args, o[k], _.concat(path, k), _.concat(schemaPath, ['properties', k])));
    }
  } else {
    if (path.length !== 0) {
      keys.push({ path: path.join('.'), schema: schemaPath.join('.') });
    }
  }
  return keys;
}

export class Args {
  type: string;
  required?: boolean;
  fragile?: boolean;
  default?: any;
  allowNull?: boolean;
  attributes?: string[];

  properties?: { [ key: string ]: Args };
  items?: Args;

  static verify(args: Args, path: string[] = []) {
    let err = (str: string, prop: string | string[]) => {
      // TODO: better error object
      console.log(_.concat(path, prop));
      throw new Error(str);
    };
    if (type(args.type) !== 'string') {
      err(`Property 'type' must be a string.`, 'type');
    }
    if (args.type !== 'json' && args.type !== 'object' && args.type !== 'array' && args.type !== 'string' && args.type !== 'number' && args.type !== 'boolean') {
      err(`Property 'type' of '${args.type}' is invalid.`, 'type');
    }
    if (path.length === 0 && args.type !== 'object') {
      err(`Root 'type' must be an object.`, 'type');
    }
    if (args.attributes != null) {
      if (type(args.attributes) !== 'array') {
        err(`List of 'attributes' must be an array.`, 'attributes');
      }
      for (let i = 0; i < args.attributes.length; ++i) {
        if (type(args.attributes[i]) !== 'string') {
          err(`Element of 'attributes' must be a string.`, ['attributes', String(i)]);
        }
      }
    }
    if (args.type === 'json') {
      let additional = _.pullAll(_.keys(args), ['type', 'allowNull', 'default', 'fragile', 'attributes']);
      if (additional.length > 0) {
        err(`Additional property '${additional[0]}' not allowed on type '${args.type}'.`, additional[0]);
      }
    } else if (args.type === 'object') {
      let additional = _.pullAll(_.keys(args), ['type', 'properties', 'allowNull', 'default', 'attributes']);
      if (additional.length > 0) {
        err(`Additional property '${additional[0]}' not allowed on type '${args.type}'.`, additional[0]);
      }
      for (let key in args.properties) {
        if (type(args.properties[key]) !== 'object') {
          err(`Object 'properties' must be objects.`, [ 'properties', key ]);
        }
        Args.verify(args.properties[key], _.concat(path, [ 'properties', key ]));
      }
    } else if (args.type === 'array') {
      let additional = _.pullAll(_.keys(args), ['type', 'items', 'default', 'allowNull', 'attributes']);
      if (additional.length > 0) {
        err(`Additional property '${additional[0]}' not allowed on type '${args.type}'.`, additional[0]);
      }
      if (type(args.items) !== 'object') {
        throw new Error(`Array 'items' must be objects.`);
      }
      Args.verify(args.items, _.concat(path, [ 'items' ]));
    } else if (args.type === 'string' || args.type === 'number' || args.type === 'boolean') {
      let additional = _.pullAll(_.keys(args), ['type', 'required', 'default', 'fragile', 'allowNull', 'attributes']);
      if (additional.length > 0) {
        err(`Additional property '${additional[0]}' not allowed on type '${args.type}'.`, additional[0]);
      }
      if (args.allowNull && args.required) {
        err(`Property "required" and "allowNull" not allowed together on type '${args.type}'.`, []);
      }
      if (args.required == null && args.default == null && args.allowNull == null) {
        err(`Property "required", "default" or "allowNull" required on type '${args.type}'.`, []);
      }
      if (args.required != null && args.default != null) {
        err(`Can only have one of "required" or "default" on type '${args.type}'.`, []);
      }
      if (args.default != null && type(args.default) != args.type) {
        if (!args.allowNull || type(args.default) === 'null') {
          err(`Property "default" must be same type as property ('${args.type}').`, []);
        }
      }
    }
  }

  static toSchema(args: Args, allowInterpolation = true) {
    let schema: any = {
      type: args.type
    };
    if (args.type === 'json') {
      schema.type = 'object';
      schema.additionalProperties = true;
    } else if (args.type === 'object') {
      schema.additionalProperties = false;
      schema.required = [];
      schema.properties = {};
      for (let key in args.properties) {
        schema.properties[key] = Args.toSchema(args.properties[key], allowInterpolation);
        if (args.properties[key].required) {
          schema.required.push(key);
        }
      }
      if (schema.required.length === 0) {
        delete schema['required'];
      }
    } else if (args.type === 'array') {
      schema.items = Args.toSchema(args.items, allowInterpolation);
    }
    schema = { anyOf: [ schema ] };
    if (args.allowNull) {
      schema.anyOf.push({ type: 'null' });
    }
    if (allowInterpolation) {
      schema.anyOf.push({ type: 'function' });
    }
    if (schema.anyOf.length == 1) {
      schema = schema.anyOf[0];
    }
    return schema;
  }

  static diff(args: Args, previous: any, updated: any, taint = false) {
    if (previous == null && updated == null) {
      return { different: false };
    }
    Args.verify(args);
    let schema = Args.toSchema(args);
    if (previous != null) {
      previous = Args.applyDefaults(args, previous);
    }
    if (updated != null) {
      validate(updated, schema, { throwError: true });
      updated = Args.applyDefaults(args, updated);
    }
    let keys = _.uniqBy(_.concat(recursiveKeys(args, previous), recursiveKeys(args, updated)), item => item.path);
    let fragile = [];
    if (previous && updated) {
      keys = _.filter(keys, key => {
        let update = _.get(updated, key.path);
        if (update instanceof Function) {
          return true;
        } else {
          return !_.isEqual(_.get(previous, key.path), update);
        }
      });
    }
    let changes: any[] = [];
    let broken = false;
    for (let key of keys) {
      let schema = _.get(args, key.schema);
      if (schema == null) {
        _.unset(previous, key.path);
        continue;
      }
      changes.push({
        path: key.path,
        schema
      });
      if (schema.fragile) {
        broken = true;
      }
    }
    let results: any = {
      different: false,
      tainted: taint,
      broken,
      changes
    };
    if (changes.length === 0 && previous && updated) {
      return results;
    }
    results.different = true;
    if (!previous && updated) {
      results.create = updated;
    } else if (previous && !updated) {
      results.destroy = previous;
    } else if (previous && updated) {
      if (taint || broken) {
        results.destroy = previous;
        results.create = updated;
      } else {
        results.update = {
          from: previous,
          to: updated
        };
      }
    }
    return results;
  }

  private static applyDefaults(args: Args, obj: any) {
    if (args.type === 'object') {
      if (obj) {
        for (let key in args.properties) {
          obj[key] = Args.applyDefaults(args.properties[key], obj[key]);
        }
      } else {
        return args.allowNull ? null : (args.default || {});
      }
    } else if (args.type === 'array') {
      if (obj) {
        for (let i = 0; i < obj.length; ++i) {
          obj[i] = Args.applyDefaults(args.items, obj[i]);
        }
      } else {
        return args.allowNull ? null : (args.default || []);
      }
    }
    obj = obj == null ? args.default : obj;
    if (!obj && args.allowNull) {
      obj = null;
    }
    return obj;
  }

  static async applyCalculations(obj: any) {
    if (obj instanceof Function) {
      return await obj();
    } else if (obj instanceof Array) {
      for (let i = 0; i < obj.length; ++i) {
        obj[i] = await Args.applyCalculations(obj[i]);
      }
    } else if (obj instanceof Object) {
      for (let k in obj) {
        obj[k] = await Args.applyCalculations(obj[k]);
      }
    }
    return obj;
  }
}
