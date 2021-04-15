import * as sortedArrayUtil from "./sorted-array-util.js";

export default class ArrayTree {
  constructor() {
    this.clear();
  }
  
  clear() {
    this._keys = [];
    this._values = [];
  }
  
  get(key) {
    let index = sortedArrayUtil.indexOf(this._keys, key);
    return index >= 0 ? this._values[index] : undefined;
  }
  
  getByIndex(index) {
    if (index < 0) return undefined;
    if (index >= this.size) return undefined;
    return this._values[index];
  }
  
  _indexAtOrAboveKey(key) {
    let index = sortedArrayUtil.indexAtOrAbove(this._keys, key);
    if (index < 0) return null;
    return {index: index, key: this._keys[index]};
  }
  
  _indexAtOrBelowKey(key) {
    let index = sortedArrayUtil.indexAtOrBelow(this._keys, key);
    if (index < 0) return null;
    return {index: index, key: this._keys[index]};
  }
  
  toArray(bounds, valuesOnly) {
    let indexInfo = this._boundsToIndex(bounds);
    return this.toArrayByIndex(indexInfo[0], indexInfo[1] - indexInfo[0] + 1, valuesOnly);
  }
  
  _boundsToIndex(bounds) {
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
  }
  
  toArrayByIndex(start, count, valuesOnly) {
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
  }
  
  set(key, value) {
    let index = sortedArrayUtil.indexAtOrBelow(this._keys, key);
    if (this._keys[index] === key) {
      this._values[index] = value;
      return;
    }
    this._keys.splice(index + 1, 0, key);
    this._values.splice(index + 1, 0, value);
  }
  
  bulkLoad(data) {
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
  }
  
  delete(key) {
    let index = sortedArrayUtil.indexOf(this._keys, key);
    if (index >= 0) {
      this._keys.splice(index, 1);
      this._values.splice(index, 1);
    }
  }
  
  getStats() {
    return { size: this.size };
  }
  
  get size() {return this._keys.length}
}
