import { expect } from 'chai';
import { Plugin, ResourceGroup, Resource } from '../src';
import * as _ from 'lodash';

describe('ordering', function() {
  it('create and destroy null resource', async function() {
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
  it('create resources', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'test.trace.a': {},
      'test.trace.b': {},
      'test.trace.c': {}
    }));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'create.test.trace.a',
      'create.test.trace.b',
      'create.test.trace.c'
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
      'create.test.trace.a',
      'create.test.trace.b',
      'create.test.trace.c',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'sync.test.trace.c',
      'destroy.test.trace.c',
      'destroy.test.trace.b',
      'destroy.test.trace.a'
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
      'create.test.trace.a',
      'create.test.trace.b',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'update.test.trace.a',
      'update.test.trace.b'
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
      'create.test.trace.a',
      'create.test.trace.b',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'destroy.test.trace.b',
      'destroy.test.trace.a',
      'create.test.trace.a',
      'create.test.trace.b'
    ]);
  });
  it('create and destroy resources in dependency order', async function() {
    let group = new ResourceGroup();
    await group.apply(await group.diff({
      'test.trace.a': { data: { $ref: 'test.trace.b:data' } },
      'test.trace.b': { data: { bac: true }},
      'test.trace.c': { data: { $toUpper: { $jsonStringify: { $ref: 'test.trace.a:data' } } } }
    }));
    expect(group.state['test.trace.a'].data.data).to.eql({ bac: true });
    expect(group.state['test.trace.b'].data.data).to.eql({ bac: true });
    expect(group.state['test.trace.c'].data.data).to.eql('{"BAC":TRUE}');
    await group.apply(await group.diff({}));
    let logs = group.getPlugin('test').logs;
    expect(logs).to.eql([
      'create.test.trace.b',
      'create.test.trace.a',
      'create.test.trace.c',
      'sync.test.trace.b',
      'sync.test.trace.a',
      'sync.test.trace.c',
      'destroy.test.trace.c',
      'destroy.test.trace.a',
      'destroy.test.trace.b'
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
      'create.test.trace.a',
      'sync.test.trace.a',
      'create.test.trace.b',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'create.test.trace.c',
      'sync.test.trace.a',
      'sync.test.trace.c',
      'sync.test.trace.b',
      'destroy.test.trace.b',
      'sync.test.trace.a',
      'sync.test.trace.c',
      'destroy.test.trace.c',
      'destroy.test.trace.a'
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
      'create.test.trace.a',
      'create.test.trace.b',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'update.test.trace.a',
      'update.test.trace.b',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'update.test.trace.a',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'update.test.trace.a',
      'update.test.trace.b',
      'sync.test.trace.a',
      'sync.test.trace.b',
      'update.test.trace.a'
    ]);
  });
});
