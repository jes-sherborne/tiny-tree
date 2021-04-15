import BTreeNode from "./b-tree-node.js";

export default class BTree {
  constructor(options) {
    options = options || {};
    this._degree = options.degree >= 3 ? options.degree : 15;
    this.clear();
  }
  
  clear() {
    this._root = new BTreeNode(this._degree);
  }
  
  get(key) {
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
  }
  
  getByIndex(index) {
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
  }
  
  _indexAtOrAboveKey(key) {
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
  }
  
  _indexAtOrBelowKey(key) {
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
  }
  
  set(key, value) {
    let result = this._root.set(key, value, false);
    if (result) this._root = result;
  }
  
  bulkLoad(data) {
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
  }
  
  delete(key) {
    this._root.delete(key);
    if (!this._root.isLeafNode && this._root.keys[0] == null) {
      this._root = this._root.children[0];
    }
  }
  
  getStats() {
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
  }
  
  get size() {return this._root.size}
}
