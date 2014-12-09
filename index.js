var merge = require('cli-util').merge
  , parse = require('cli-argparse')
  , environ = require('cli-env');

/**
 *  Create a configuration store.
 *
 *  ### Options
 *
 *  * global - Use a global object for the storage.
 *  * varname - The name of the global variable.
 *  * env - Default options to pass when extracting variables
 *    from the environment.
 *  * argv - Default options to pass when extracing command line
 *    arguments.
 *  * cache - A boolean indicating that loading from files should clear
 *    the internal require cache.
 */
function ConfigStore(opts) {
  this.options = merge(opts || {}, {}, {copy: true});
  this.storage = ConfigStore.storage;
  if(this.options.global) {

    /**
     *  Globals are an anti-pattern.
     *
     *  However this prevents conflicts when
     *  multiple modules depend upon this module
     *  and wish to access the same shared configuration
     *  data when they resolve to different modules.
     */
    this.storage = global[this.options.varname || 'CONFIG_STORAGE'] = {};
  }
  this.types = [
    'file',
    'env',
    'argv',
    'custom'
  ]
  for(var i = 0;i < this.types.length;i++) {
    this.storage[this.types[i]] = {};
  }
}

/**
 *  Import variables from the environment into the `env` store.
 */
function env() {
  if(this.options.env) {
    this.storage.env = environ(this.options.env);
  }else{
    this.storage.env = process.env;
  }
  return this;
}

/**
 *  Parse arguments and merge into the `argv` store.
 *
 *  @param args Array of string arguments, default is `process.argv.slice(2)`.
 *  @param options Options to pass to the argument parser.
 */
function argv(args, options) {
  options = options || this.options.argv
  var result = parse(args || process.argv.slice(2), options)
    , k;
  for(k in result.flags) {
    this.storage.argv[k] = result.flags[k];
  }
  for(k in result.options) {
    this.storage.argv[k] = result.options[k];
  }
  return this;
}

/**
 *  Load configuration data from a file using `require()` and merge
 *  info the `file` store.
 *
 *  @param file The path to the file.
 *  @param cb A callback function.
 */
function file(file, cb) {
  var contents;
  try {
    file = require.resolve(file);
    if(this.options.cache === false) {
      delete require.cache[file];
    }
    contents = require(file);
    if(typeof contents !== 'object') {
      throw new Error(
        'invalid configuration file export, object expected');
    }
  }catch(e) {
    return cb(e);
  }
  merge(contents, this.storage.file);
  cb(null, contents, file);
  return this;
}

/**
 *  Replace environment variables in string values.
 *
 *  ### Options
 *
 *  Options to pass when calling env().
 *
 *  * env - The object containing environment variables, default
 *    is `process.env`.
 *  * escaping - Whether escaped variable declarations are ignored, default
 *    is `true`.
 *  * convert - An optional convert function.
 *  * strict - Whether an error is thrown when a referenced variable
 *    does not exist, default is `true`.
 */
function replace(opts) {
  opts = opts || {};
  opts.strict = typeof opts.strict === 'boolean'
    ? opts.strict : true;
  for(var i = 0;i < this.types.length;i++) {
    environ.env(
      this.storage[this.types[i]],
      opts.env, opts.escaping, opts.convert, opts.strict);
  }
  return this;
}

/**
 *  Get data from the storage.
 *
 *  @param key The key for the data.
 */
function get(key) {
  var i
    , stash
    , types = this.types.reverse();

  for(i = 0;i < types.length;i++) {
    stash = this.storage[types[i]];
    if(stash[key]) {
      return stash[key];
    }
  }
}

/**
 *  Set a configuration value.
 *
 *  @param key The key for the data.
 *  @param value The valud for the data.
 *  @param store A string store name, default is *custom*.
 */
function set(key, value, store) {
  store = store || 'custom';
  this.storage[store] = this.storage[store] || {};
  if(!~this.types.indexOf(store)) {
    this.types.push(store);
  }
  this.storage[store][key] = value;
}

/**
 *  Clear all data from the storage.
 */
function clear() {
  for(var i = 0;i < this.types.length;i++) {
    this.storage[this.types[i]] = {};
  }
}

// module level storage
ConfigStore.storage = {};

ConfigStore.prototype.argv = argv;
ConfigStore.prototype.env = env;
ConfigStore.prototype.file = file;
ConfigStore.prototype.replace = replace;
ConfigStore.prototype.get = get;
ConfigStore.prototype.set = set;
ConfigStore.prototype.clear = clear;

module.exports = ConfigStore;
