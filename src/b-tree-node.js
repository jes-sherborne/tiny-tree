export default class BTreeNode {
  constructor(degree, keys, values, children) {
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
  }
  
  set(key, value, bulkMode) {
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
    
  }
  
  completeBulkLoad() {
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
    
  }
  
  _splice(i, key, value, children, bulkMode) {
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
  }
  
  _split(bulkMode) {
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
  }
  
  delete(key) {
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
    
  }
  
  _removeSplittingKey(iKey) {
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
  }
  
  _mergeMax() {
    let nFilled = this.filledKeys;
    
    if (this.children[nFilled].isLeafNode) {
      
      this._mergeChild(nFilled);
      
    } else {
      
      this.children[nFilled]._mergeMax();
      if (this.children[nFilled].needsMerge) {
        this._mergeChild(nFilled);
      }
      
    }
  }
  
  _mergeChild(iChild) {
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
  }
  
  _inject(iKey, side, info) {
    let nFilled = this.filledKeys;
    
    arrayShiftInsert(this.keys, iKey, info.key, nFilled);
    arrayShiftInsert(this.values, iKey, info.value, nFilled);
    this.size += 1;
    if (info.child) {
      arrayShiftInsert(this.children, side === "LEFT" ? iKey : iKey + 1, info.child, nFilled + 1);
      this.size += info.child.size;
    }
  }
  
  _injectRight(info) {
    let nFilled = this.filledKeys;
    
    arrayShiftInsert(this.keys, nFilled, info.key, nFilled);
    arrayShiftInsert(this.values, nFilled, info.value, nFilled);
    this.size += 1;
    if (info.child) {
      arrayShiftInsert(this.children, nFilled + 1, info.child, nFilled + 1);
      this.size += info.child.size;
    }
  }
  
  _extract(iKey, side, preserveSize) {
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
  }
  
  _extractRight(preserveSize) {
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
  }
  
  _promoteMax() {
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
  }
  
  _updateStats(stats, depth) {
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
  }
  
  get isLeafNode() {return this.children == null}
  get hasRoom() {return this.keys[this.keys.length - 1] == null}
  get filledKeys() {
    for (let i = this.keys.length - 1; i >= 0; i--) {
      if (this.keys[i] != null) return i + 1;
    }
    return 0;
  }
  get minimumFilledKeys() { return Math.floor(this.keys.length / 2) }
  get needsMerge() { return this.keys[this.minimumFilledKeys - 1] == null }
}


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
