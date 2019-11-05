const sortedArrayUtil = require("./sorted-array-util");

function ArrayTree() {
  this.clear();
}

ArrayTree.prototype.clear = function() {
  this._keys = [];
  this._values = [];
};

ArrayTree.prototype.get = function(key) {
  let index = sortedArrayUtil.indexOf(this._keys, key);
  return index >=0 ? this._values[index] : undefined;
};

ArrayTree.prototype.getByIndex = function(index) {
  if (index < 0) return undefined;
  if (index >= this.size) return undefined;
  return this._values[index];
};

ArrayTree.prototype._indexAtOrAboveKey = function(key) {
  let index = sortedArrayUtil.indexAtOrAbove(this._keys, key);
  if (index < 0) return null;
  return {index: index, key: this._keys[index]};
};

ArrayTree.prototype._indexAtOrBelowKey = function(key) {
  let index = sortedArrayUtil.indexAtOrBelow(this._keys, key);
  if (index < 0) return null;
  return {index: index, key: this._keys[index]};
};

ArrayTree.prototype.toArray = function(bounds, valuesOnly) {
  let indexInfo = this._boundsToIndex(bounds);
  return this.toArrayByIndex(indexInfo[0], indexInfo[1] - indexInfo[0] + 1, valuesOnly);
};

ArrayTree.prototype._boundsToIndex = function(bounds) {
  let start = 0, end = this.size - 1;
  
  if (bounds) {
    
    if (bounds.min != null) {
      let indexInfo = this._indexAtOrAboveKey(bounds.min);
      start = indexInfo.index;
    } else if (bounds.minInclusive != null) {
      let indexInfo = this._indexAtOrAboveKey(bounds.minInclusive);
      start = indexInfo.index;
    } else if (bounds.minExclusive != null) {
      let indexInfo = this._indexAtOrAboveKey(bounds.minExclusive);
      start = indexInfo.index;
      if (indexInfo.key === bounds.minExclusive) start += 1;
    }
    
    if (bounds.max != null) {
      let indexInfo = this._indexAtOrBelowKey(bounds.max);
      end = indexInfo.index;
      if (indexInfo.key === bounds.max) end -= 1;
    } else if (bounds.maxExclusive != null) {
      let indexInfo = this._indexAtOrBelowKey(bounds.maxExclusive);
      end = indexInfo.index;
      if (indexInfo.key === bounds.maxExclusive) end -= 1;
    } else if (bounds.maxInclusive != null) {
      let indexInfo = this._indexAtOrBelowKey(bounds.maxInclusive);
      end = indexInfo.index;
    }
    
  }
  return [start, end]
};

ArrayTree.prototype.toArrayByIndex = function(start, count, valuesOnly) {
  if (start < 0) {
    count += start;
    start = 0;
  }
  if (count < 1) return [];
  
  if (valuesOnly) return this._values.slice(start, start + count);
  
  let result = [];
  for (let i = start; i < start + count; i++) {
    result.push([this._keys[i], this._values[i]]);
  }
  return result;
};

ArrayTree.prototype.set = function(key, value) {
  let index = sortedArrayUtil.indexAtOrBelow(this._keys, key);
  if (this._keys[index] === key) {
    this._values[index] = value;
    return;
  }
  this._keys.splice(index + 1, 0, key);
  this._values.splice(index + 1, 0, value);
};

ArrayTree.prototype.bulkLoad = function(data) {
  let index = 0;
  if (this.size) throw new Error("Bulk load not allowed on non-empty trees");
  
  if (!data.length) return;
  this._keys.push(data[0][0]);
  this._values.push(data[0][1]);
  let lastKey = data[0][0];
  
  for (let i = 1; i < data.length; i++) {
    let item = data[i];
    if (!(item[0] >= lastKey)) throw new Error("Keys must be sorted in ascending order");
    if (item[0] === lastKey) {
      this._values[index] = item[1];
    } else {
      this._keys.push(item[0]);
      this._values.push(item[1]);
      index++;
    }
  }
};

ArrayTree.prototype.delete = function(key) {
  let index = sortedArrayUtil.indexOf(this._keys, key);
  if (index >= 0) {
    this._keys.splice(index, 1);
    this._values.splice(index, 1);
  }
};

ArrayTree.prototype.getStats = function() {
  return { size: this.size };
};

Object.defineProperties(ArrayTree.prototype, {
  size: {
    enumerable: true,
    get: function() {return this._keys.length}
  }
});

exports.ArrayTree = ArrayTree;