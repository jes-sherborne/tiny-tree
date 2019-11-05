function BTree(options) {
  options = options || {};
  this._degree = options.degree >= 3 ? options.degree : 15;
  this.clear();
}

BTree.prototype.clear = function() {
  this._root = new BTree.Node(this._degree);
};

BTree.prototype.get = function(key) {
  let current = this._root;
  
  while (current) {
    let i;
    for (i = 0; i < current.keys.length; i++) {
      if (current.keys[i] == null || current.keys[i] > key) {
        break;
      }
      if (current.keys[i] === key) {
        return current.values[i];
      }
    }
    current = current.children ? current.children[i] : null;
  }
  
  return undefined;
};

BTree.prototype.getByIndex = function(index) {
  let current = this._root, iThis = 0;
  
  if (index < 0) return undefined;
  if (index >= this.size) return undefined;
  
  while (true) {
    let i;

    if (current.isLeafNode) {
      return current.values[index - iThis];
    }
    
    for (i = 0; i < current.keys.length; i++) {
      if (current.keys[i] == null) break;
      
      if (index < iThis + current.children[i].size) {
        break;
      } else {
        iThis += current.children[i].size;
      }
      if (iThis === index) {
        return current.values[i];
      } else {
        iThis++;
      }
    }
    current = current.children[i];
  }
  
  return undefined;
};

BTree.prototype._indexAtOrAboveKey = function(key) {
  let current = this._root;
  
  let index = 0;
  
  while (current) {
    let i;
    for (i = 0; i < current.keys.length; i++) {
      if (current.keys[i] == null) {
        break;
      } else if (current.keys[i] < key) {
        if (current.children) {
          index += current.children[i].size;
        }
        index += 1;
      } else if (current.keys[i] === key) {
        if (current.children) {
          index += current.children[i].size;
        }
        return {index: index, key: current.keys[i]};
      } else {
        
        if (current.children) {
          break;
        } else {
          return {index: index, key: current.keys[i] };
        }
      }
    }
    current = current.children ? current.children[i] : null;
  }
  
  return null;
};

BTree.prototype._indexAtOrBelowKey = function(key) {
  let current = this._root;
  
  let index = this.size - 1;
  
  while (current) {
    let i;
    for (i = current.keys.length - 1; i >= 0; i--) {
      if (current.keys[i] == null) {
        // ignore
      } else if (current.keys[i] > key) {
        if (current.children) {
          index -= current.children[i + 1].size;
        }
        index -= 1;
      } else if (current.keys[i] === key) {
        if (current.children) {
          index -= current.children[i + 1].size;
        }
        return {index: index, key: current.keys[i]};
      } else {
        
        if (current.children) {
          break;
        } else {
          return {index: index, key: current.keys[i] };
        }
      }
    }
    current = current.children ? current.children[i + 1] : null;
  }
  
  return null;
};

BTree.prototype.toArray = function(bounds, valuesOnly) {
  let indexInfo = this._boundsToIndex(bounds);
  return this.toArrayByIndex(indexInfo[0], indexInfo[1] - indexInfo[0] + 1, valuesOnly);
};

BTree.prototype._boundsToIndex = function(bounds) {
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

BTree.prototype.toArrayByIndex = function(start, count, valuesOnly) {
  let stack = [], ctx, index, result = [], end = start + count - 1;
  
  if (start < 0) {
    count += start;
    start = 0;
  }
  if (count < 1) return [];
  
  ctx = {node: this._root, iKey: 0, nKeys: this._root.filledKeys, isLeafNode: this._root.isLeafNode, phase: 0};
  
  index = 0;
  
  while (ctx) {
    
    if (index > end) return result;
    
    if (ctx.isLeafNode) {
      
      if (index + ctx.node.size - 1 < start) {
        // skip this node
        index += ctx.node.size;
      } else {
        for (let i = 0; i < ctx.nKeys; i++) {
          
          if (index < start) {
            // skip this key
            index += 1;
          } else {
            
            if (index >= start && index <= end) {
              result.push(valuesOnly ? ctx.node.values[i] : [ctx.node.keys[i], ctx.node.values[i]]);
            }
            index++;
            
          }
          
        }
      }
      
      ctx = stack.pop();
      
    } else if (ctx.phase === 0) {
      
      // Child segment
      let child = ctx.node.children[ctx.iKey];
      ctx.phase = 1;
      
      if (index + child.size - 1 < start) {
        // skip this child
        index += child.size;
      } else {
        // traverse into child
        stack.push(ctx);
        ctx = {node: child, iKey: 0, nKeys: child.filledKeys, isLeafNode: child.isLeafNode, phase: 0};
      }
      
    } else {
      
      // Key segment
      if (ctx.iKey === ctx.nKeys) {
        ctx = stack.pop();
      } else {
        
        if (index < start) {
          // skip this key
          index += 1;
        } else {
          if (index >= start && index <= end) {
            result.push(valuesOnly ? ctx.node.values[ctx.iKey] : [ctx.node.keys[ctx.iKey], ctx.node.values[ctx.iKey]]);
          }
          index++;
        }
        
        ctx.iKey++;
        ctx.phase = 0;
        
      }
      
    }
    
  }
  
  return result;
};

BTree.prototype.set = function(key, value) {
  let result = this._root.set(key, value, false);
  if (result) this._root = result;
};

BTree.prototype.bulkLoad = function(data) {
  if (this.size) throw new Error("Bulk load not allowed on non-empty trees");
  
  if (!data.length) return;
  let lastKey = data[0][0];
  
  for (let item of data) {
    if (!(item[0] >= lastKey)) throw new Error("Keys must be sorted in ascending order");
    lastKey = item[0];
    let result = this._root.set(item[0], item[1], true);
    if (result) this._root = result;
  }
  this._root.completeBulkLoad();
};

BTree.prototype.delete = function(key) {
  this._root.delete(key);
  if (!this._root.isLeafNode && this._root.keys[0] == null) {
    this._root = this._root.children[0];
  }
};

BTree.prototype.getStats = function() {
  let result = {
    degree: this._degree,
    size: this.size,
    depth: 0,
    fillFactor: null,
    nodes: 0,
    saturationFactor: null,
    keySlots: 0,
    filledKeySlots: 0,
    saturatedNodes: 0,
  };
  
  this._root._updateStats(result, 0);
  
  result.fillFactor = result.filledKeySlots / result.keySlots;
  result.saturationFactor = result.saturatedNodes / result.nodes;
  
  return result;
};

Object.defineProperties(BTree.prototype, {
  size: {
    enumerable: true,
    get: function() {return this._root.size}
  }
});

BTree.Node = function (degree, keys, values, children) {
  this.size = 0;
  this.keys = new Array(degree - 1);
  this.values = new Array(degree - 1);
  this.children = null;
  
  if (keys) {
    for (let i = 0; i < keys.length; i++) {
      this.keys[i] = keys[i];
      this.values[i] = values[i];
      this.size += 1;
    }
    if (children) {
      this.children = new Array(degree);
      for (let i = 0; i < children.length; i++) {
        this.children[i] = children[i];
        this.size += children[i].size;
      }
    }
  }
};

BTree.Node.prototype.set = function(key, value, bulkMode) {
  let i;
  for (i = 0; i < this.keys.length; i++) {
    if (this.keys[i] == null || this.keys[i] > key) {
      break;
    }
    if (this.keys[i] === key) {
      this.values[i] = value;
      return null;
    }
  }
  
  if (this.isLeafNode) {
    let insertResult = this._splice(i, key, value, null, bulkMode);
    if (insertResult) return insertResult;
    return null;
  }
  
  let oldSize = this.children[i].size;
  let insertResult = this.children[i].set(key, value, bulkMode);
  
  if (insertResult) {
    this.size += this.children[i].size - oldSize;
    return this._splice(i, insertResult.keys[0], insertResult.values[0], insertResult.children, bulkMode);
  } else {
    this.size += this.children[i].size - oldSize;
  }
  
  return null;
  
};

BTree.Node.prototype.completeBulkLoad = function() {
  // after bulk loading, the right-hand nodes may need merging
  if (this.children) {
    for (let i = this.children.length - 1; i >= 0; i--) {
      if (this.children[i]) {
        if (this.children[i].needsMerge) {
          this._mergeChild(i);
        }
        if (!this.children[i].isLeafNode) {
          this.children[i].completeBulkLoad();
        }
        return;
      }
    }
  }
  
};

BTree.Node.prototype._splice = function(i, key, value, children, bulkMode) {
  if (this.hasRoom) {
    this._inject(i, "LEFT", {key: key, value: value, child: children ? children[0] : null});
    if (children) {
      if (this.children[i + 1]) {
        this.size -= this.children[i + 1].size;
      }
      this.children[i + 1] = children[1];
      this.size += children[1].size;
    }
    return null;
  }
  
  this.keys.splice(i, 0, key);
  this.values.splice(i, 0, value);
  this.size += 1;
  
  if (children) {
    this.size -= this.children[i].size;
    this.size += children[0].size;
    this.size += children[1].size;
    this.children.splice(i, 1, children[0], children[1]);
  }
  return this._split(bulkMode);
};

BTree.Node.prototype._split = function(bulkMode) {
  // n.b.: all arrays are oversized by one
  const degree = this.keys.length;
  
  const splitPoint = bulkMode ? this.keys.length - 1 : Math.floor(this.keys.length / 2);
  
  let rightChildren = null;
  if (!this.isLeafNode) {
    rightChildren = this.children.slice(splitPoint + 1);
    for (let i = splitPoint + 1; i <= degree; i++) {
      this.size -= this.children[i].size;
      this.children[i] = null;
    }
    this.children.length = degree;
  }
  let newRightNode = new this.constructor(degree, this.keys.slice(splitPoint + 1), this.values.slice(splitPoint + 1), rightChildren);
  
  let parentKey = this.keys[splitPoint];
  let parentValue = this.values[splitPoint];
  
  for (let i = splitPoint; i <= degree - 1; i++) {
    this.size -= 1;
    this.keys[i] = null;
    this.values[i] = null;
  }
  this.keys.length = degree - 1;
  this.values.length = degree - 1;
  
  return new this.constructor(degree, [parentKey], [parentValue], [
    this,
    newRightNode
  ]);
};

BTree.Node.prototype.delete = function(key) {
  let i;
  for (i = 0; i < this.keys.length; i++) {
    if (this.keys[i] == null || this.keys[i] > key) {
      break;
    }
    if (this.keys[i] === key) {
      let oldSize = this.size;
      if (this.isLeafNode) {
        this._extract(i, "NULL", true);
      } else {
        this._removeSplittingKey(i);
      }
      
      this.size = oldSize - 1;
      return;
    }
  }
  
  if (this.isLeafNode) return;
  
  let child = this.children[i];
  let oldSize = child.size;
  child.delete(key);
  this.size += child.size - oldSize;
  
  if (child.needsMerge) this._mergeChild(i);
  
};

BTree.Node.prototype._removeSplittingKey = function(iKey) {
  let promote = this.children[iKey]._promoteMax();
  this.keys[iKey] = promote.key;
  this.values[iKey] = promote.value;
  
  if (!promote.needsMerge) return;
  
  if (this.children[iKey].isLeafNode) {
    this._mergeChild(iKey);
  } else {
    this.children[iKey]._mergeMax();
    if (this.children[iKey].needsMerge) {
      this._mergeChild(iKey);
    }
  }
};

BTree.Node.prototype._mergeMax = function() {
  let nFilled = this.filledKeys;
  
  if (this.children[nFilled].isLeafNode) {
    
    this._mergeChild(nFilled);
    
  } else {
    
    this.children[nFilled]._mergeMax();
    if (this.children[nFilled].needsMerge) {
      this._mergeChild(nFilled);
    }
    
  }
};

BTree.Node.prototype._mergeChild = function(iChild) {
  let left, right, current = this.children[iChild];
  
  const mergeNodes = (target, source, iParentKey) => {
    let iKey = target.filledKeys;
    
    target.keys[iKey] = this.keys[iParentKey];
    target.values[iKey] = this.values[iParentKey];
    target.size += 1;
    
    iKey++;
    
    let i;
    for (i = 0; i < source.filledKeys; i++) {
      target.keys[iKey] = source.keys[i];
      target.values[iKey] = source.values[i];
      target.size += 1;
      if (source.children) {
        target.children[iKey] = source.children[i];
        target.size += source.children[i].size;
      }
      iKey++;
    }
    if (source.children) {
      target.children[iKey] = source.children[i];
      target.size += source.children[i].size;
    }
  };
  
  if (iChild > 0) left = this.children[iChild - 1];
  if (iChild + 1 < this.children.length) right = this.children[iChild + 1];
  
  if (left != null && left.filledKeys > left.minimumFilledKeys) {
    while (current.needsMerge) {
      let iParentKey = iChild - 1;
      let extract = left._extractRight();
      
      current._inject(0, "LEFT", {
        key: this.keys[iParentKey],
        value: this.values[iParentKey],
        child: extract.child
      });
      this.keys[iParentKey] = extract.key;
      this.values[iParentKey] = extract.value;
    }
    return false;
  }
  
  if (right != null && right.filledKeys > right.minimumFilledKeys) {
    while (current.needsMerge) {
      let iParentKey = iChild;
      let extract = right._extract(0, "LEFT");
      
      current._injectRight({
        key: this.keys[iParentKey],
        value: this.values[iParentKey],
        child: extract.child
      });
      this.keys[iParentKey] = extract.key;
      this.values[iParentKey] = extract.value;
    }
    return false;
  }
  
  if (left) {
    mergeNodes(left, current, iChild - 1);
    this._extract(iChild - 1, "RIGHT", true);
  } else {
    mergeNodes(current, right, iChild);
    this._extract(iChild, "RIGHT", true);
  }
  
  return this.needsMerge;
};

BTree.Node.prototype._inject = function(iKey, side, info) {
  let nFilled = this.filledKeys;
  
  arrayShiftInsert(this.keys, iKey, info.key, nFilled);
  arrayShiftInsert(this.values, iKey, info.value, nFilled);
  this.size += 1;
  if (info.child) {
    arrayShiftInsert(this.children, side === "LEFT" ? iKey : iKey + 1, info.child, nFilled + 1);
    this.size += info.child.size;
  }
};

BTree.Node.prototype._injectRight = function(info) {
  let nFilled = this.filledKeys;
  
  arrayShiftInsert(this.keys, nFilled, info.key, nFilled);
  arrayShiftInsert(this.values, nFilled, info.value, nFilled);
  this.size += 1;
  if (info.child) {
    arrayShiftInsert(this.children, nFilled + 1, info.child, nFilled + 1);
    this.size += info.child.size;
  }
};

BTree.Node.prototype._extract = function(iKey, side, preserveSize) {
  let nFilled = this.filledKeys;
  
  let result = {
    key: arrayShiftDelete(this.keys, iKey, nFilled),
    value: arrayShiftDelete(this.values, iKey, nFilled),
    child: this.isLeafNode ? null : arrayShiftDelete(this.children, side === "LEFT" ? iKey : iKey + 1, nFilled + 1)
  };
  
  if (!preserveSize) {
    this.size -= 1;
    if (result.child) this.size -= result.child.size;
  }
  
  return result;
};

BTree.Node.prototype._extractRight = function(preserveSize) {
  let nFilled = this.filledKeys;
  
  let result = {
    key: arrayShiftDelete(this.keys, nFilled - 1, nFilled),
    value: arrayShiftDelete(this.values, nFilled - 1, nFilled),
    child: this.isLeafNode ? null : arrayShiftDelete(this.children, nFilled, nFilled + 1)
  };
  
  if (!preserveSize) {
    this.size -= 1;
    if (result.child) this.size -= result.child.size;
  }
  
  return result;
};

BTree.Node.prototype._promoteMax = function() {
  if (this.isLeafNode) {
    let result = this._extractRight();
    result.needsMerge = this.needsMerge;
    return result;
  }
  
  let child = this.children[this.filledKeys];
  let oldSize = child.size;
  let result = child._promoteMax();
  this.size += child.size - oldSize;
  return result;
};

BTree.Node.prototype._updateStats = function(stats, depth) {
  depth++;
  
  stats.depth = Math.max(stats.depth, depth);
  stats.nodes++;
  stats.keySlots += this.keys.length;
  stats.filledKeySlots += this.filledKeys;
  if (!this.hasRoom) stats.saturatedNodes++;
  
  if (this.children) {
    for (let i = 0; i < this.children.length; i++) {
      if (!this.children[i]) break;
      this.children[i]._updateStats(stats, depth);
    }
  }
};

Object.defineProperties(BTree.Node.prototype, {
  isLeafNode: {get: function() {return this.children == null}},
  hasRoom: {get: function() {return this.keys[this.keys.length - 1] == null}},
  filledKeys: {
    get: function() {
      for (let i = this.keys.length - 1; i >= 0; i--) {
        if (this.keys[i] != null) return i + 1;
      }
      return 0;
    }
  },
  minimumFilledKeys: {
    get: function() {
      return Math.floor(this.keys.length / 2);
    }
  },
  needsMerge: {
    get: function() {
      return this.keys[this.minimumFilledKeys - 1] == null;
    }
  }
});


function arrayShiftInsert(arr, i, value, nFilled) {
  for (let j = nFilled - 1; j >= i; j--) {
    arr[j + 1] = arr[j];
  }
  arr[i] = value;
}

function arrayShiftDelete(arr, i, nFilled) {
  let result = arr[i];
  for (let j = i + 1; j < nFilled; j++) {
    arr[j - 1] = arr[j];
  }
  arr[nFilled - 1] = null;
  return result;
}


exports.BTree = BTree;