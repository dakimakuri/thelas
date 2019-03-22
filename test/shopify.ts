import { expect } from 'chai';
import { Plugin, ResourceGroup, Resource } from '../src';
import * as _ from 'lodash';
import * as sinon from 'sinon';
import * as request from 'request-promise-native';

let provider = { api_key: 'api', password: 'pw', shop: 'shop' };
let sandbox: sinon.Sandbox;

describe('shopify', function() {
  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });
  afterEach(function() {
    sandbox.restore();
  });
  describe('product resource', function() {
    it('should create product', async function() {
      let stub = sandbox.stub(request, 'post').resolves(JSON.stringify({
        product: {
          options: [],
          variants: []
        }
      }));
      let group = new ResourceGroup();
      await group.apply(await group.diff({
        'provider.shopify': provider,
        'shopify.product.a': {
          title: 'Test Product',
          handle: 'test-product',
          body_html: '<b>cool product</b>'
        }
      }));
      let args = stub.getCall(0).args;
      let url = args[0];
      let options = args[1];
      let body = JSON.parse(options.body);
      expect(url).to.eql('https://shop.myshopify.com/admin/products.json');
      expect(options.auth).to.eql({ user: provider.api_key, pass: provider.password, sendImmediately: false });
      expect(options.headers).to.eql({ 'content-type': 'application/json' });
      expect(body.product.title).to.eql('Test Product');
      expect(body.product.handle).to.eql('test-product');
      expect(body.product.body_html).to.eql('<b>cool product</b>');
    });
  });
});
