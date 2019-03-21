import { expect } from 'chai';
import { Interpolator } from '../src';

function interpolateCheck(input: any, expected: any) {
  it(JSON.stringify(input) + ' -> ' + JSON.stringify(expected), async function() {
    let interpolator = new Interpolator();
    input = await interpolator.preprocess(input);
    input = await interpolator.process(input);
    input = await Interpolator.postprocess(input);
    expect(input).to.eql(expected);
  });
}

describe('interpolations', function() {
  describe('$add', function() {
    interpolateCheck({ $add: 5 }, 5);
    interpolateCheck({ $add: { $fn: 5 } }, 5);
    interpolateCheck({ $add: [ 5 ] }, 5);
    interpolateCheck({ $add: [ 5, 2 ] }, 7);
    interpolateCheck({ $add: [ 5, 2, 3 ] }, 7);
  });
  describe('$ceil', function() {
    interpolateCheck({ $ceil: 4.006 }, 5);
    interpolateCheck({ $ceil: [ 4.006 ] }, 5);
    interpolateCheck({ $ceil: [ 6.004, 2 ] }, 6.01);
    interpolateCheck({ $ceil: [ 6040, -2 ] }, 6100);
  });
  describe('$divide', function() {
    interpolateCheck({ $divide: [ 6, 4 ] }, 1.5);
    interpolateCheck({ $divide: [ 6, 4, 5 ] }, 1.5);
    interpolateCheck({ $divide: [ 1, 0 ] }, Infinity);
  });
  describe('$floor', function() {
    interpolateCheck({ $floor: [ 4.006 ] }, 4);
    interpolateCheck({ $floor: [ 0.046, 2 ] }, 0.04);
    interpolateCheck({ $floor: [ 4060, -2 ] }, 4000);
  });
  describe('$max', function() {
    interpolateCheck({ $max: [ 4, 2, 8, 6 ] }, 8);
    interpolateCheck({ $max: [] }, undefined);
  });
  describe('$maxBy', function() {
    interpolateCheck({ $maxBy: [ [ { n: 1 }, { n: 2 } ], 'n' ] }, { n: 2 });
    interpolateCheck({ $maxBy: [ [], 'n' ] }, undefined);
  });
  describe('$mean', function() {
    interpolateCheck({ $mean: [ 4, 2, 8, 6 ] }, 5);
    interpolateCheck({ $mean: [] }, NaN);
  });
  describe('$meanBy', function() {
    interpolateCheck({ $meanBy: [ [ { n: 4 }, { n: 2 }, { n: 8 }, { n: 6 } ], 'n' ] }, 5);
    interpolateCheck({ $meanBy: [ [], 'n' ] }, NaN);
  });
  describe('$min', function() {
    interpolateCheck({ $min: [ 4, 2, 8, 6 ] }, 2);
    interpolateCheck({ $min: [] }, undefined);
  });
  describe('$minBy', function() {
    interpolateCheck({ $minBy: [ [ { n: 4 }, { n: 2 }, { n: 8 }, { n: 6 } ], 'n' ] }, { n: 2 });
    interpolateCheck({ $minBy: [ [], 'n' ] }, undefined);
  });
  describe('$multiply', function() {
    interpolateCheck({ $multiply: 6 }, 6);
    interpolateCheck({ $multiply: [ 6 ] }, 6);
    interpolateCheck({ $multiply: [ 6, 4 ] }, 24);
    interpolateCheck({ $multiply: [ 6, 4, 5 ] }, 24);
  });
  describe('$round', function() {
    interpolateCheck({ $round: 4.006 }, 4);
    interpolateCheck({ $round: [ 4.006 ] }, 4);
    interpolateCheck({ $round: [ 4.006, 2 ] }, 4.01);
    interpolateCheck({ $round: [ 4060, -2 ] }, 4100);
  });
  describe('$subtract', function() {
    interpolateCheck({ $subtract: 6 }, 6);
    interpolateCheck({ $subtract: [ 6 ] }, 6);
    interpolateCheck({ $subtract: [ 6, 4 ] }, 2);
    interpolateCheck({ $subtract: [ 6, 4, 3 ] }, 2);
  });
  describe('$sum', function() {
    interpolateCheck({ $sum: [ 4, 2, 8, 6 ] }, 20);
  });
  describe('$sumBy', function() {
    interpolateCheck({ $sumBy: [ [ { n: 4 }, { n: 2 }, { n: 8 }, { n: 6 } ], 'n' ] }, 20);
  });
  describe('$clamp', function() {
    interpolateCheck({ $clamp: [ -10, -5, 5 ] }, -5);
    interpolateCheck({ $clamp: [ 10, -5, 5 ] }, 5);
  });
  describe('$inRange', function() {
    interpolateCheck({ $inRange: [ 3, 2, 4 ] }, true);
    interpolateCheck({ $inRange: [ 4, 8 ] }, true);
    interpolateCheck({ $inRange: [ 4, 2 ] }, false);
    interpolateCheck({ $inRange: [ 2, 2 ] }, false);
    interpolateCheck({ $inRange: [ 1.2, 2 ] }, true);
    interpolateCheck({ $inRange: [ 5.2, 4 ] }, false);
    interpolateCheck({ $inRange: [ -3, -2, -6 ] }, true);
  });
  describe('$camelCase', function() {
    interpolateCheck({ $camelCase: 'Foo Bar' }, 'fooBar');
    interpolateCheck({ $camelCase: '--foo-bar--' }, 'fooBar');
    interpolateCheck({ $camelCase: '__FOO_BAR__' }, 'fooBar');
  });
  describe('$capitalize', function() {
    interpolateCheck({ $capitalize: 'FRED' }, 'Fred');
  });
  describe('$deburr', function() {
    interpolateCheck({ $deburr: 'déjà vu' }, 'deja vu');
  });
  describe('$endsWith', function() {
    interpolateCheck({ $endsWith: [ 'abc', 'c' ] }, true);
    interpolateCheck({ $endsWith: [ 'abc', 'b' ] }, false);
    interpolateCheck({ $endsWith: [ 'abc', 'b', 2 ] }, true);
  });
  describe('$escape', function() {
    interpolateCheck({ $escape: 'fred, barney, & pebbles' }, 'fred, barney, &amp; pebbles');
  });
  describe('$kebabCase', function() {
    interpolateCheck({ $kebabCase: 'Foo Bar' }, 'foo-bar');
    interpolateCheck({ $kebabCase: '--foo-bar--' }, 'foo-bar');
    interpolateCheck({ $kebabCase: '__FOO_BAR__' }, 'foo-bar');
  });
  describe('$lowerCase', function() {
    interpolateCheck({ $lowerCase: '--Foo-Bar--' }, 'foo bar');
    interpolateCheck({ $lowerCase: 'fooBar' }, 'foo bar');
    interpolateCheck({ $lowerCase: '__FOO_BAR__' }, 'foo bar');
  });
  describe('$lowerFirst', function() {
    interpolateCheck({ $lowerFirst: 'Fred' }, 'fred');
    interpolateCheck({ $lowerFirst: 'FRED' }, 'fRED');
  });
  describe('$pad', function() {
    interpolateCheck({ $pad: [ 'abc', 8 ] }, '  abc   ');
    interpolateCheck({ $pad: [ 'abc', 8, '_-' ] }, '_-abc_-_');
    interpolateCheck({ $pad: [ 'abc', 3 ] }, 'abc');
  });
  describe('$padEnd', function() {
    interpolateCheck({ $padEnd: [ 'abc', 6 ] }, 'abc   ');
    interpolateCheck({ $padEnd: [ 'abc', 6, '_-' ] }, 'abc_-_');
    interpolateCheck({ $padEnd: [ 'abc', 3 ] }, 'abc');
  });
  describe('$padStart', function() {
    interpolateCheck({ $padStart: [ 'abc', 6 ] }, '   abc');
    interpolateCheck({ $padStart: [ 'abc', 6, '_-' ] }, '_-_abc');
    interpolateCheck({ $padStart: [ 'abc', 3 ] }, 'abc');
  });
  describe('$parseInt', function() {
    interpolateCheck({ $parseInt: '08' }, 8);
  });
  describe('$repeat', function() {
    interpolateCheck({ $repeat: [ '*', 3 ] }, '***');
    interpolateCheck({ $repeat: [ 'abc', 2 ] }, 'abcabc');
    interpolateCheck({ $repeat: [ 'abc', 0 ] }, '');
  });
  describe('$replace', function() {
    interpolateCheck({ $replace: [ 'Hi Fred', 'Fred', 'Barney' ] }, 'Hi Barney');
  });
  describe('$snakeCase', function() {
    interpolateCheck({ $snakeCase: 'Foo Bar' }, 'foo_bar');
    interpolateCheck({ $snakeCase: 'fooBar' }, 'foo_bar');
    interpolateCheck({ $snakeCase: '--FOO-BAR--' }, 'foo_bar');
  });
  describe('$split', function() {
    interpolateCheck({ $split: [ 'a-b-c', '-' ] }, [ 'a', 'b', 'c' ]);
    interpolateCheck({ $split: [ 'a-b-c', '-', 2 ] }, [ 'a', 'b' ]);
  });
  describe('$startCase', function() {
    interpolateCheck({ $startCase: '--foo-bar--' }, 'Foo Bar');
    interpolateCheck({ $startCase: 'fooBar' }, 'Foo Bar');
    interpolateCheck({ $startCase: '__FOO_BAR__' }, 'FOO BAR');
  });
  describe('$startsWith', function() {
    interpolateCheck({ $startsWith: [ 'abc', 'a' ] }, true);
    interpolateCheck({ $startsWith: [ 'abc', 'b' ] }, false);
    interpolateCheck({ $startsWith: [ 'abc', 'b', 1 ] }, true);
  });
  describe('$toLower', function() {
    interpolateCheck({ $toLower: '--Foo-Bar--' }, '--foo-bar--');
    interpolateCheck({ $toLower: 'fooBar' }, 'foobar');
    interpolateCheck({ $toLower: '__FOO_BAR__' }, '__foo_bar__');
  });
  describe('$toUpper', function() {
    interpolateCheck({ $toUpper: '--foo-bar--' }, '--FOO-BAR--');
    interpolateCheck({ $toUpper: 'fooBar' }, 'FOOBAR');
    interpolateCheck({ $toUpper: '__foo_bar__' }, '__FOO_BAR__');
  });
  describe('$trim', function() {
    interpolateCheck({ $trim: '  abc  ' }, 'abc');
    interpolateCheck({ $trim: [ '-_-abc-_-', '_-' ] }, 'abc');
  });
  describe('$trimEnd', function() {
    interpolateCheck({ $trimEnd: '  abc  ' }, '  abc');
    interpolateCheck({ $trimEnd: [ '-_-abc-_-', '_-' ] }, '-_-abc');
  });
  describe('$trimStart', function() {
    interpolateCheck({ $trimStart: '  abc  ' }, 'abc  ');
    interpolateCheck({ $trimStart: [ '-_-abc-_-', '_-' ] }, 'abc-_-');
  });
  describe('$truncate', function() {
    interpolateCheck({ $truncate: 'hi-diddly-ho there, neighborino' }, 'hi-diddly-ho there, neighbo...');
    interpolateCheck({ $truncate: ['hi-diddly-ho there, neighborino', { length: 24, separator: ' ' } ] }, 'hi-diddly-ho there,...');
    interpolateCheck({ $truncate: ['hi-diddly-ho there, neighborino', { omission: ' [...]' } ] }, 'hi-diddly-ho there, neig [...]');
  });
  describe('$unescape', function() {
    interpolateCheck({ $unescape: 'fred, barney, &amp; pebbles' }, 'fred, barney, & pebbles');
  });
  describe('$upperCase', function() {
    interpolateCheck({ $upperCase: '--foo-bar' }, 'FOO BAR');
    interpolateCheck({ $upperCase: 'fooBar' }, 'FOO BAR');
    interpolateCheck({ $upperCase: '__foo_bar__' }, 'FOO BAR');
  });
  describe('$upperFirst', function() {
    interpolateCheck({ $upperFirst: 'fred' }, 'Fred');
    interpolateCheck({ $upperFirst: 'FRED' }, 'FRED');
  });
  describe('$words', function() {
    interpolateCheck({ $words: 'fred, barney, & pebbles' }, ['fred', 'barney', 'pebbles']);
  });
  describe('$md5', function() {
    interpolateCheck({ $md5: '' }, 'd41d8cd98f00b204e9800998ecf8427e');
    interpolateCheck({ $md5: 'hello world' }, '5eb63bbbe01eeed093cb22bb8f5acdc3');
    interpolateCheck({ $md5: { $file: './assets/md5.data' } }, '6f5902ac237024bdd0c176cb93063dc4');
  });
  describe('$stringify', function() {
    interpolateCheck({ $stringify: { foo: 'bar' } }, '{\n  "foo": "bar"\n}');
  });
  describe('$jsonStringify', function() {
    interpolateCheck({ $jsonStringify: { foo: 'bar' } }, '{"foo":"bar"}');
  });
  describe('$template', function() {
    interpolateCheck({ $template: '' }, '');
    interpolateCheck({ $template: [ 'hello <%= user %>!', { user: 'fred' } ] }, 'hello fred!');
    interpolateCheck({ $template: [ '<b><%- value %></b>', { value: '<script>' } ] }, '<b>&lt;script&gt;</b>');
    interpolateCheck({ $template: [ '<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>', { users: ['fred', 'barney'] } ] }, '<li>fred</li><li>barney</li>');
    interpolateCheck({ $template: [ '<% print("hello " + user); %>!', { user: 'barney' } ] }, 'hello barney!');
    interpolateCheck({ $template: [ 'hello ${ user }!', { user: 'pebbles' } ] }, 'hello pebbles!');
    interpolateCheck({ $template: [ '<%= "\\<%- value %\\>" %>', { value: 'ignored' } ] }, '<%- value %>');
  });
  describe('$include', function() {
    interpolateCheck({ $include: './assets/hello.5.json' }, { hello: 5 });
    interpolateCheck({ $include: './assets/arr.1.2.json' }, [ 1, 2 ]);
    interpolateCheck({ $add: { $include: './assets/arr.1.2.json' } }, 3);
  });
  describe('$fn', function() {
    it('{"$fn":5}', async function() {
      let interpolator = new Interpolator();
      let input = { $fn: 5 };
      input = await interpolator.preprocess(input);
      expect(input).to.be.eql({ $fn: 5 });
      input = await interpolator.process(input);
      expect(input).to.be.a('function');
      input = await Interpolator.postprocess(input);
      expect(input).to.eql(5);
    });
    it('{"$fn":{"$fn":{"$fn":{"$fn":5}}}}', async function() {
      let interpolator = new Interpolator();
      let input = { $fn: { $fn: { $fn: { $fn: 5 } } } };
      input = await interpolator.preprocess(input);
      expect(input).to.be.eql({ $fn: { $fn: { $fn: { $fn: 5 } } } });
      input = await interpolator.process(input);
      for (let i = 0; i < 4; ++i) {
        expect(input).to.be.a('function');
        input = await Interpolator.postprocess(input);
      }
      expect(input).to.eql(5);
    });
    it('{"a":{"$fn":5},"b":3}', async function() {
      let interpolator = new Interpolator();
      let input = { a: { $fn: 5 }, b: 3 };
      input = await interpolator.preprocess(input);
      expect(input).to.be.eql({ a: { $fn: 5 }, b: 3 });
      input = await interpolator.process(input);
      expect(input.a).to.be.a('function');
      expect(input.b).to.be.eql(3);
      input = await Interpolator.postprocess(input);
      expect(input).to.eql({ a: 5, b: 3 });
    });
    interpolateCheck({ $add: { $fn: 5 } }, 5);
    interpolateCheck({ $split: { $fn: [ 'a-b-c', '-', 2 ] } }, [ 'a', 'b' ]);
    interpolateCheck({ $split: [ { $fn: 'a-b-c' }, { $fn: '-' }, { $fn: 2 } ] }, [ 'a', 'b' ]);
    interpolateCheck({ $fn: { $split: [ 'a-b-c', '-', 2 ] } }, [ 'a', 'b' ]);
  });
});
