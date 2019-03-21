import { expect } from 'chai';
import { Plugin, ResourceGroup, Resource } from '../src';
import * as _ from 'lodash';

describe('provider', function() {
  it('should create resource with default provider', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'test.trace.res': {}
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'create.test.trace.res',
      'cleanup.provider.test.default'
    ]);
  });
  it('should create resource with overridden default provider', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.default': { tag: 'foobar' },
      'test.trace.res': {}
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default-foobar',
      'cleanup.provider.test.default-foobar',
      'init.provider.test.default-foobar',
      'create.test.trace.res-foobar',
      'cleanup.provider.test.default-foobar'
    ]);
  });
  it('should create resource with overridden default provider specified', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.default': { tag: 'foobar' },
      'test.trace.res': { provider: 'default' }
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default-foobar',
      'cleanup.provider.test.default-foobar',
      'init.provider.test.default-foobar',
      'create.test.trace.res-foobar',
      'cleanup.provider.test.default-foobar'
    ]);
  });
  it('should create resource with custom provider', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.custom': { tag: 'foobar' },
      'test.trace.res': { provider: 'custom' }
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.custom-foobar',
      'cleanup.provider.test.custom-foobar',
      'init.provider.test.custom-foobar',
      'create.test.trace.res-foobar',
      'cleanup.provider.test.custom-foobar'
    ]);
  });
  /*it('should create resource with provider and destroy it with provider', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.custom': { tag: 'foobar' },
      'test.trace.res': { provider: 'custom' }
    }));
    await group.apply(await group.diff({
      'provider.test.custom': { tag: 'foobar' },
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'create.test.trace.res-foobar'
    ]);
  });
  it('should create resource with provider and destroy it without provider', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.custom': { tag: 'foobar' },
      'test.trace.res': { provider: 'custom' }
    }));
    await group.apply(await group.diff({}));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'create.test.trace.res-foobar'
    ]);
  });*/
});
