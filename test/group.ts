import { expect } from 'chai';
import { Plugin, ResourceGroup, Resource } from '../src';
import * as _ from 'lodash';

describe('resource group', function() {
  it('should create and destroy null resource', async function() {
    let group = new ResourceGroup();
    let diff = await group.diff({
      'test.null.a': {}
    });
    expect(diff.length).to.equal(1);
    expect(diff[0].name).to.equal('test.null.a');
    expect(diff[0].diff).to.be.an('object');
    expect(diff[0].diff.different).to.equal(true);
    await group.apply(diff);
    expect(group.state['test.null.a']).to.eql({ data: {}, attributes: {} });
    diff = await group.diff({});
    expect(diff.length).to.equal(1);
    expect(diff[0].name).to.equal('test.null.a');
    expect(diff[0].diff).to.be.an('object');
    expect(diff[0].diff.different).to.equal(true);
    await group.apply(diff);
    expect(group.state['test.null.a']).to.eql(undefined);
  });
});
