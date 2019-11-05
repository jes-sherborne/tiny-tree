// Exposes a similar interface to tiny-tree with a vastly simpler implementation for testing.
// Many of the functions here are implemented in a very inefficient way and have no business being used in
// production code.

const devUtil = require("../dev-util/dev-util");

function KvTestStore() {
  this._data = new Map();
}

KvTestStore.prototype.set = function(key, value) {
  this._data.set(key, value);
};

KvTestStore.prototype.get = function(key) {
  return this._data.get(key) || null;
};

KvTestStore.prototype.getByIndex = function(index) {
  let result = this.toArrayByIndex(index, 1);
  if (!result.length) return null;
  return result[0][1];
};

KvTestStore.prototype.delete = function(key) {
  this._data.delete(key);
};

KvTestStore.prototype.toArray = function(bounds, valuesOnly) {
  let result = [], started = false;
  
  let keys = Array.from(this._data.keys());
  keys.sort(devUtil.simpleSort);
  
  for (let key of keys) {
    if (keyPassesBounds(key, bounds)) {
      started = true;
      result.push(valuesOnly ? this._data.get(key) : [key, this._data.get(key)]);
    } else {
      if (started) break;
    }
  }
  
  return result;
};

KvTestStore.prototype.toArrayByIndex = function(start, count, valuesOnly) {
  let result = [];
  
  if (!(count > 0)) return result;
  
  let keys = Array.from(this._data.keys());
  keys.sort(devUtil.simpleSort);
  
  for (let iKey = start; iKey < start + count; iKey++) {
    result.push(valuesOnly ? this._data.get(keys[iKey]) : [keys[iKey], this._data.get(keys[iKey])]);
  }
  return result;
};

KvTestStore.prototype.getRandom = function() {
  let iTarget = Math.floor(Math.random() * this.size);
  let iCurrent = 0;
  
  for (const [key, values] of this._data) {
    for (const value of values) {
      if (iCurrent === iTarget) {
        return [key, value];
      }
      iCurrent++;
    }
  }
};

KvTestStore.prototype.deleteRandom = function() {
  let result = this.getRandom();
  this.delete(result[0], result[1]);
  return result;
};

Object.defineProperties(KvTestStore.prototype, {
  size: {get: function() {return this._data.size}}
});

function keyPassesBounds(key, bounds) {
  if (bounds == null) return true;
  
  if (bounds.min != null && key < bounds.min) return false;
  if (bounds.minInclusive != null && key < bounds.minInclusive) return false;
  
  if (bounds.minExclusive != null && key <= bounds.minExclusive) return false;
  
  if (bounds.max != null && key >= bounds.max) return false;
  if (bounds.maxExclusive != null && key >= bounds.maxExclusive) return false;
  
  if (bounds.maxInclusive != null && key > bounds.maxInclusive) return false;
  
  return true;
}

exports.KvTestStore = KvTestStore;
