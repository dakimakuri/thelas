import { Args } from './args';
import * as _ from 'lodash';
import { validate } from 'jsonschema';

const safeMode = false;

export class ResourceCreateEvent {
  data: any;
  changes: any;
  attributes: any;
}

export class ResourceUpdateEvent {
  data: any;
  from: any;
  changes: any;
  attributes: any;
}

export class ResourceDestroyEvent {
  data: any;
  changes: any;
  attributes: any;
}

export class ResourceSyncEvent {
  data: any;
  attributes: any;
}

export abstract class Resource {
  public providers: any = {};

  constructor(public name: string, public args: Args, public options: any = {}) {
    if (!options.providers) {
      options.providers = {};
    }
  }

  async apply(diff: any, attributes: any) {
    if (safeMode) {
      throw new Error('Apply cancelled - in safe mode.');
    }
    let data: any = null;
    if (diff.destroy) {
      await this.destroy({
        data: diff.destroy,
        changes: diff.changes,
        attributes: attributes
      });
      attributes = null;
      data = null;
    }
    if (diff.create) {
      let to = await Args.applyCalculations(diff.create);
      let schema = Args.toSchema(this.args, false);
      validate(to, schema, { throwError: true });
      attributes = await this.create({
        data: to,
        changes: diff.changes,
        attributes: attributes
      });
      data = diff.create;
    }
    if (diff.update) {
      let to = await Args.applyCalculations(diff.update.to);
      attributes = await this.update({
        from: diff.update.from,
        data: to,
        changes: diff.changes,
        attributes: attributes
      });
      data = diff.update.to;
    }
    return { data, attributes };
  }

  abstract create(event: ResourceCreateEvent): any;
  abstract update(event: ResourceUpdateEvent): any;
  abstract destroy(event: ResourceDestroyEvent): void;
  abstract sync(event: ResourceSyncEvent): any;
  abstract import(id: string): any;
}
