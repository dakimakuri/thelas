import { expect } from 'chai';
import { Plugin, ResourceGroup, Resource } from '../src';
import * as _ from 'lodash';
import { ValidationError } from 'jsonschema';

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
  it('should type check arguments', async function() {
    let group = new ResourceGroup();
    await expect(group.apply(await group.diff({
      'test.trace.a': { tag: 10 }
    }))).to.eventually.be.rejected;
    await expect(group.apply(await group.diff({
      'test.trace.a': { nullProperty: 10 }
    }))).to.eventually.be.rejected;
    await expect(group.apply(await group.diff({
      'test.trace.a': { data: 10 }
    }))).to.eventually.be.rejected;
    await expect(group.apply(await group.diff({
      'test.trace.a': { data: { $: '10' } }
    }))).to.eventually.be.rejected;
  });
});
