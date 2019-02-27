import { Args } from './args';
import * as _ from 'lodash';

const safeMode = false;

export class ResourceCreateEvent {
  data: any;
  changes: any;
  attributes: any;
}

export class ResourceUpdateEvent {
  from: any;
  to: any;
  changes: any;
  attributes: any;
}

export class ResourceDestroyEvent {
  oldData: any;
  changes: any;
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
        oldData: diff.destroy,
        changes: diff.changes,
        attributes: attributes
      });
      attributes = null;
      data = null;
    }
    if (diff.create) {
      attributes = await this.create({
        data: await Args.applyCalculations(diff.create),
        changes: diff.changes,
        attributes: attributes
      });
      data = diff.create;
    }
    if (diff.update) {
      attributes = await this.update({
        from: diff.update.from,
        to: await Args.applyCalculations(diff.update.to),
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
  abstract sync(data: any, attributes: any): any;
  abstract import(id: string): any;
}
