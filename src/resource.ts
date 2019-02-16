import { Args } from './args';
import * as _ from 'lodash';

export class Resource {
  private data = null;
  private attributes = null;

  constructor(private provider: any, public name: string) {
  }

  get state() {
    return {
      data: this.data,
      attributes: this.attributes
    };
  }

  set state(value: any) {
    this.data = value.data;
    this.attributes = value.attributes;
  }

  async sync() {
    if (this.data) {
      this.data = await this.provider.sync(this.data, this.attributes);
    }
  }

  diff(updated: any, taint = false) {
    return Args.diff({ type: 'object', properties: this.provider.args }, this.data, updated, taint);
  }

  async apply(diff: any) {
    if (diff.destroy) {
      await this.provider.destroy({
        oldData: diff.destroy,
        changes: diff.changes,
        attributes: this.attributes
      });
      this.attributes = null;
      this.data = null;
    }
    if (diff.create) {
      this.attributes = await this.provider.create({
        data: Args.applyCalculations(diff.create),
        changes: diff.changes,
        attributes: this.attributes
      });
      this.data = diff.create;
    }
    if (diff.update) {
      this.attributes = await this.provider.update({
        from: diff.update.from,
        to: Args.applyCalculations(diff.update.to),
        changes: diff.changes,
        attributes: this.attributes
      });
      this.data = diff.update.to;
    }
    return this.attributes;
  }

  invalidatedAttributes(diff: any) {
    let attrs: string[] = [];
    for (let change of diff.changes) {
      attrs = _.concat(attrs, change.schema.attributes);
      if (change.schema.fragile) {
        return null;
      }
    }
    return _.uniq(attrs);
  }
}
