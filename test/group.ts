import { expect } from 'chai';
import { Plugin, ResourceGroup, Resource } from '../src';
import * as _ from 'lodash';

describe('resource group', function() {
  it('should create and destroy null resource', async function() {
    let group = new ResourceGroup();
    let diff = await group.diff({
      'test.null.a': {}
    });
    expect(diff.updates.length).to.equal(1);
    expect(diff.updates[0].name).to.equal('test.null.a');
    expect(diff.updates[0].diff).to.be.an('object');
    expect(diff.updates[0].diff.different).to.equal(true);
    await group.apply(diff);
    expect(group.state.resources['test.null.a']).to.eql({ data: {}, attributes: {} });
    diff = await group.diff({});
    expect(diff.updates.length).to.equal(1);
    expect(diff.updates[0].name).to.equal('test.null.a');
    expect(diff.updates[0].diff).to.be.an('object');
    expect(diff.updates[0].diff.different).to.equal(true);
    await group.apply(diff);
    expect(group.state.resources['test.null.a']).to.eql(undefined);
  });
});
