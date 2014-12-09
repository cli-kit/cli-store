var expect = require('chai').expect
  , path = require('path')
  , ConfigStore = require('../..');

describe('Store:', function() {

  it('should create config store', function(done) {
    var store = new ConfigStore();
    expect(store.options).to.be.an('object');
    expect(store.types).to.be.an('array');
    expect(store.storage).to.be.an('object');
    store.clear();
    done();
  });

  it('should create global config store', function(done) {
    var store = new ConfigStore({global: true});
    expect(global.CONFIG_STORAGE).to.be.an('object');
    done();
  });

  it('should chain calls', function(done) {
    var store = new ConfigStore()
      .argv()
      .env();
    expect(store).to.be.an.instanceof(ConfigStore);
    done();
  });

  it('should import from process.argv', function(done) {
    var store = new ConfigStore();
    store.argv();
    expect(Object.keys(store.storage.argv).length).to.be.gt(0);
    done();
  });

  it('should use process environment', function(done) {
    var store = new ConfigStore();
    store.env();
    expect(store.storage.env).to.be.an('object');
    expect(Object.keys(store.storage.env).length).to.be.gt(0);
    done();
  });

  it('should import from environment', function(done) {
    process.env.sa_mock_var='mock-value';
    var store = new ConfigStore(
      {env: {prefix: 'sa', initialize: true, match: /^sa_/i}});
    store.env();
    expect(store.storage.env).to.be.an('object');
    expect(Object.keys(store.storage.env).length).to.be.gt(0);
    expect(store.get('mockVar')).to.eql('mock-value');
    done();
  });

  it('should replace environment variables', function(done) {
    process.env.var_ref='var-ref-value';
    process.env.sa_mock_var='${var_ref}';
    var store = new ConfigStore(
      {env: {prefix: 'sa', initialize: true, match: /^sa_/i}});
    store.env();
    store.replace({strict: false});
    expect(store.storage.env).to.be.an('object');
    expect(Object.keys(store.storage.env).length).to.be.gt(0);
    expect(store.get('mockVar')).to.eql('var-ref-value');
    done();
  });

  it('should replace environment variables (zero options)', function(done) {
    process.env.var_ref='var-ref-value';
    process.env.sa_mock_var='${var_ref}';
    var store = new ConfigStore(
      {env: {prefix: 'sa', initialize: true, match: /^sa_/i}});
    store.env();
    store.replace();
    expect(store.storage.env).to.be.an('object');
    expect(Object.keys(store.storage.env).length).to.be.gt(0);
    expect(store.get('mockVar')).to.eql('var-ref-value');
    done();
  });

  it('should set custom configuration store value', function(done) {
    var store = new ConfigStore();
    store.set('customvar', 'custom-value');
    expect(store.get('customvar')).to.eql('custom-value');
    done();
  });

  it('should use specific configuration store group', function(done) {
    var store = new ConfigStore();
    store.set('groupvar', 'group-value', 'group');
    expect(store.get('groupvar')).to.eql('group-value');
    done();
  });

  it('should callback with error on invalid file', function(done) {
    var store = new ConfigStore();
    store.file('non-existent.js', function onLoad(err, contents) {
      function fn() {
        throw err;
      }
      expect(fn).throws(err);
      done();
    });
  });

  it('should callback with file contents', function(done) {
    var file = path.join(__dirname ,'..', 'fixtures', 'config.json');
    var store = new ConfigStore();
    store.file(file, function onLoad(err, contents) {
      expect(err).to.eql(null);
      expect(contents).to.be.an('object');
      done();
    });
  });

  it('should callback with file contents with cache disabled', function(done) {
    var file = path.join(__dirname ,'..', 'fixtures', 'config.json');
    var store = new ConfigStore({cache: false});
    store.file(file, function onLoad(err, contents) {
      expect(err).to.eql(null);
      expect(contents).to.be.an('object');
      done();
    });
  });

  it('should callback with error on invalid export', function(done) {
    var file = path.join(__dirname ,'..', 'fixtures', 'bad-export');
    var store = new ConfigStore();
    store.file(file, function onLoad(err, contents) {
      function fn() {
        throw err;
      }
      expect(fn).throws(err);
      done();
    });
  });

});
