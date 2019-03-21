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
  it('should sync with updated provider data', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.custom': { tag: 'foobar' },
      'test.trace.res': { provider: 'custom' }
    }));
    await group.apply(await group.diff({
      'provider.test.custom': { tag: 'newbar' },
      'test.trace.res': { provider: 'custom' }
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.custom-foobar',
      'cleanup.provider.test.custom-foobar',
      'init.provider.test.custom-foobar',
      'create.test.trace.res-foobar',
      'cleanup.provider.test.custom-foobar',
      'init.provider.test.custom-newbar',
      'sync.test.trace.res-newbar',
      'cleanup.provider.test.custom-newbar',
      'init.provider.test.custom-newbar',
      'cleanup.provider.test.custom-newbar'
    ]);
  });
  it('should create resource with custom provider and destroy it with overidden default provider', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.default': { tag: 'foobar' },
      'test.trace.res': {}
    }));
    await group.apply(await group.diff({
      'provider.test.default': { tag: 'foobar' }
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default-foobar',
      'cleanup.provider.test.default-foobar',
      'init.provider.test.default-foobar',
      'create.test.trace.res-foobar',
      'cleanup.provider.test.default-foobar',
      'init.provider.test.default-foobar',
      'sync.test.trace.res-foobar',
      'cleanup.provider.test.default-foobar',
      'init.provider.test.default-foobar',
      'destroy.test.trace.res-foobar',
      'cleanup.provider.test.default-foobar'
    ]);
  });
  it('should create resource with custom provider and destroy it with custom provider', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.custom': { tag: 'foobar' },
      'test.trace.res': { provider: 'custom' }
    }));
    await group.apply(await group.diff({
      'provider.test.custom': { tag: 'foobar' }
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.custom-foobar',
      'cleanup.provider.test.custom-foobar',
      'init.provider.test.custom-foobar',
      'create.test.trace.res-foobar',
      'cleanup.provider.test.custom-foobar',
      'init.provider.test.custom-foobar',
      'sync.test.trace.res-foobar',
      'cleanup.provider.test.custom-foobar',
      'init.provider.test.custom-foobar',
      'destroy.test.trace.res-foobar',
      'cleanup.provider.test.custom-foobar'
    ]);
  });
  it('should create resource with overidden default provider and destroy it without provider', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.default': { tag: 'foobar' },
      'test.trace.res': {}
    }));
    await group.apply(await group.diff({}));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default-foobar',
      'cleanup.provider.test.default-foobar',
      'init.provider.test.default-foobar',
      'create.test.trace.res-foobar',
      'cleanup.provider.test.default-foobar',
      'init.provider.test.default-foobar',
      'sync.test.trace.res-foobar',
      'cleanup.provider.test.default-foobar',
      'init.provider.test.default-foobar',
      'destroy.test.trace.res-foobar',
      'cleanup.provider.test.default-foobar'
    ]);
  });
  it('should create resource with custom provider and destroy it without provider', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.custom': { tag: 'foobar' },
      'test.trace.res': { provider: 'custom' }
    }));
    await group.apply(await group.diff({}));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.custom-foobar',
      'cleanup.provider.test.custom-foobar',
      'init.provider.test.custom-foobar',
      'create.test.trace.res-foobar',
      'cleanup.provider.test.custom-foobar',
      'init.provider.test.custom-foobar',
      'sync.test.trace.res-foobar',
      'cleanup.provider.test.custom-foobar',
      'init.provider.test.custom-foobar',
      'destroy.test.trace.res-foobar',
      'cleanup.provider.test.custom-foobar'
    ]);
  });
  it('should import resource with provider', async function() {
    let group = new ResourceGroup();
    await group.import(await group.diff({
      'provider.test': { tag: 'foobar' },
      'test.trace.a': {},
      'test.trace.b': {}
    }), 'test.trace.a', 'a');
    await group.import(await group.diff({
      'provider.test': { tag: 'foobar' },
      'test.trace.a': {},
      'test.trace.b': {}
    }), 'test.trace.b', 'b');
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default-foobar',
      'cleanup.provider.test.default-foobar',
      'init.provider.test.default-foobar',
      'import.test.trace.a-foobar=a',
      'cleanup.provider.test.default-foobar',
      'init.provider.test.default-foobar',
      'sync.test.trace.a-foobar',
      'cleanup.provider.test.default-foobar',
      'init.provider.test.default-foobar',
      'import.test.trace.b-foobar=b',
      'cleanup.provider.test.default-foobar'
    ]);
  });
  it('should run init and cleanup without modifying state', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.custom': { tag: 'foobar', modified: false },
      'test.trace.a': { provider: 'custom' }
    }));
    expect(group.state.providers.length).to.eql(1);
    expect(group.state.providers[0].fqn).to.eql('provider.test.custom');
    expect(group.state.providers[0].data.modified).to.eql(false);
  });
  it('should allow basic interpolations in provider', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'provider.test.custom': { tag: { $add: [ 'foo', 'bar' ] } },
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
});
