import { expect } from 'chai';
import { Plugin, ResourceGroup, Resource } from '../src';
import * as _ from 'lodash';
import * as fs from 'fs-extra';

describe('upgrade state', function() {
  it('should upgrade from version 1', async function() {
    let group = new ResourceGroup();
    group.state = await fs.readJson('./upgrade/v1.json.state');
    let diff = await group.diff(await fs.readJson('./upgrade/v1.json'));
    expect(diff.updates.length).to.eql(1);
    expect(diff.updates[0].diff.different).to.eql(false);
  });
});
