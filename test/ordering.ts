import { expect } from 'chai';
import { Plugin, ResourceGroup, Resource } from '../src';
import * as _ from 'lodash';

describe('ordering', function() {
  it('create resources', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'test.trace.a': {},
      'test.trace.b': {},
      'test.trace.c': {}
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'create.test.trace.a',
      'create.test.trace.b',
      'create.test.trace.c',
      'cleanup.provider.test.default'
    ]);
  });
  it('destroy resources', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'test.trace.a': {},
      'test.trace.b': {},
      'test.trace.c': {}
    }));
    await group.apply(await group.diff({}));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'create.test.trace.a',
      'create.test.trace.b',
      'create.test.trace.c',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'sync.test.trace.c',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'destroy.test.trace.c',
      'destroy.test.trace.b',
      'destroy.test.trace.a',
      'cleanup.provider.test.default'
    ]);
  });
  it('update resources', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'test.trace.a': {},
      'test.trace.b': {}
    }));
    await group.apply(await group.diff({
      'test.trace.a': { data: { a: 1 } },
      'test.trace.b': { data: { a: 2 } }
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'create.test.trace.a',
      'create.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'update.test.trace.a',
      'update.test.trace.b',
      'cleanup.provider.test.default'
    ]);
  });
  it('recreate broken resources', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'test.trace.a': {},
      'test.trace.b': {}
    }));
    await group.apply(await group.diff({
      'test.trace.a': { fragileData: { a: 1 } },
      'test.trace.b': { fragileData: { b: 1 } }
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'create.test.trace.a',
      'create.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'destroy.test.trace.b',
      'destroy.test.trace.a',
      'create.test.trace.a',
      'create.test.trace.b',
      'cleanup.provider.test.default'
    ]);
  });
  it('create and destroy resources in dependency order', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'test.trace.a': { data: { $ref: 'test.trace.b:data' } },
      'test.trace.b': { data: { bac: true }},
      'test.trace.c': { data: { $toUpper: { $jsonStringify: { $ref: 'test.trace.a:data' } } } }
    }));
    expect(group.state.resources['test.trace.a'].data.data).to.eql({ bac: true });
    expect(group.state.resources['test.trace.b'].data.data).to.eql({ bac: true });
    expect(group.state.resources['test.trace.c'].data.data).to.eql('{"BAC":TRUE}');
    await group.apply(await group.diff({}));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'create.test.trace.b',
      'create.test.trace.a',
      'create.test.trace.c',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.b',
      'sync.test.trace.a',
      'sync.test.trace.c',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'destroy.test.trace.c',
      'destroy.test.trace.a',
      'destroy.test.trace.b',
      'cleanup.provider.test.default'
    ]);
  });
  it('create and destroy staggered resources', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'test.trace.a': {}
    }));
    await group.apply(await group.diff({
      'test.trace.a': {},
      'test.trace.b': {}
    }));
    await group.apply(await group.diff({
      'test.trace.a': {},
      'test.trace.b': {},
      'test.trace.c': {},
    }));
    await group.apply(await group.diff({
      'test.trace.a': {},
      'test.trace.c': {},
    }));
    await group.apply(await group.diff({}));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'create.test.trace.a',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'create.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'create.test.trace.c',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'sync.test.trace.c',
      'sync.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'destroy.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'sync.test.trace.c',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'destroy.test.trace.c',
      'destroy.test.trace.a',
      'cleanup.provider.test.default'
    ]);
  });
  it('cascading update', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'test.trace.a': { data: { a: 5 }, privateData: { b: 1 } },
      'test.trace.b': { data: { $ref: 'test.trace.a:data' } }
    }));
    await group.apply(await group.diff({
      'test.trace.a': { data: { a: 3 }, privateData: { b: 1 } },
      'test.trace.b': { data: { $ref: 'test.trace.a:data' } }
    }));
    await group.apply(await group.diff({
      'test.trace.a': { data: { a: 3 }, privateData: { b: 2 } },
      'test.trace.b': { data: { $ref: 'test.trace.a:data' } }
    }));
    await group.apply(await group.diff({
      'test.trace.a': { data: { a: 3 } },
      'test.trace.b': { data: { a: 1 } }
    }));
    await group.apply(await group.diff({
      'test.trace.a': { data: { a: 2 } },
      'test.trace.b': { data: { a: 1 } }
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'create.test.trace.a',
      'create.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'update.test.trace.a',
      'update.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'update.test.trace.a',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'update.test.trace.a',
      'update.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'update.test.trace.a',
      'cleanup.provider.test.default'
    ]);
  });
  it('import resource', async function() {
    let group = new ResourceGroup();
    await group.import(await group.diff({
      'test.trace.a': {},
      'test.trace.b': {}
    }), 'test.trace.a', 'a');
    await group.import(await group.diff({
      'test.trace.a': {},
      'test.trace.b': {}
    }), 'test.trace.b', 'b');
    await group.apply(await group.diff({
      'test.trace.a': {},
      'test.trace.b': {}
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'init.provider.test.default',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'import.test.trace.a=a',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'import.test.trace.b=b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'cleanup.provider.test.default',
      'init.provider.test.default',
      'cleanup.provider.test.default'
    ]);
  });
});
