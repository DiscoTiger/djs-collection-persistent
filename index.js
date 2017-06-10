const Collection = require("djs-collection");
const levelup = require('levelup');

/**
 * A persistent, disk-saved version of the Discord.js' Collections data structure.
 * @extends {Collection}
 */
class PersistentCollection extends Collection {

  constructor(options = {}) {
    super();
    if (!options.name) throw new Error("Must provide a name for the collection.");
    
    this.ready = false;
    this.name = options.name;
    //todo: check for "unique" option for the DB name and exit if exists
    this._validateName();
    this.dataDir = (options.dataDir || "data");
    this.db = levelup(require("path").join(__dirname, this.dataDir, this.name));
    this.init();
  }
  
  init() {
    const stream = this.db.keyStream();
    stream.on('data', key => {
      this.db.get(key, (err, value) => {
        if(err) console.log(err);
        this.set(key, value);
      });
    });
    stream.on('end', () => this.ready = true);
  }
  
  _validateName() {
    this.name = this.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
  
  set(key, val) {
    this.db.put(key, val);
    return super.set(key, val);
  }

  delete(key, bulk = false) {
    if(bulk) this.db.del(key);
    return super.delete(key);
  }
  
  deleteAll() {
    const returns = [];
    const ops = [];
    for (const key of this.keys()) {
      returns.push(this.delete(key));
      ops.push({type: 'del', key});
    }
    this.db.batch(ops);
    return returns;
  }
  
  purge() {
    // todo: purge completely deletes the DB using FS
  }
}

module.exports = PersistentCollection;