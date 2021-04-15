/*
 * Performs deep inspection on a b-tree and verifies that it is properly formed
 */

export default function verify(tree) {
  let globalUnique = new Set([tree._root]);
  checkNode(tree._root, tree._degree, true, null, null, globalUnique);
  checkLeafDepth(tree._root, 0, null);
}

function checkLeafDepth(node, currentDepth, checkDepth) {
  currentDepth++;
  
  if (node.children) {
    for (let child of node.children) {
      if (child == null) break;
      let result = checkLeafDepth(child, currentDepth, checkDepth);
      if (result != null) checkDepth = result;
    }
    return;
  }
  
  if (checkDepth == null) {
    return currentDepth;
  }
  if (checkDepth !== currentDepth) {
    throw new Error("Invalid depth");
  }
  
  return currentDepth;
  
}

function checkNode(node, degree, isRoot, minValue, maxValue, globalUnique) {
  let hasChildren = node.children != null;
  let calculatedSize = 0;
  
  validateArray(node.keys, {
    allowNull: false,
    arrayLength: degree - 1,
    allowDiscontiguousNulls: false,
    requireAscending: true,
    minFilled: isRoot ? 0 : Math.floor((degree - 1) / 2),
    maxFilled: degree - 1,
    minValue: minValue,
    maxValue: maxValue
  });
  
  let nFilled = filledCount(node.keys);
  
  for (let i = 0; i < nFilled; i++) {
    calculatedSize += 1;
  }
  
  validateArray(node.values, {
    allowNull: false,
    arrayLength: degree - 1,
    allowDiscontiguousNulls: true,
    requireAscending: false,
    minFilled: 0,
    maxFilled: nFilled
  });
  
  if (hasChildren) {
  
    validateArray(node.children, {
      allowNull: false,
      arrayLength: degree,
      allowDiscontiguousNulls: false,
      requireAscending: false,
      requireDistinct: true,
      minFilled: nFilled + 1,
      maxFilled: nFilled + 1
    });
    
    for (let i = 0; i <= nFilled; i++) {
      let child = node.children[i];
      calculatedSize += child.size;
  
      if (globalUnique.has(child)) throw new Error("Duplicate child across nodes");
      globalUnique.add(child);
      checkNode(child, degree, false, i === 0 ? minValue : node.keys[i - 1], i === nFilled ? maxValue : node.keys[i], globalUnique);
    }
  }
  
  if (calculatedSize !== node.size) throw new Error("Size mismatch");
}

function validateArray(arr, options) {
  if (arr == null) {
    if (options.allowNull) return true;
    throw new Error ("Array cannot be null");
  }
  
  if (options.arrayLength != null && arr.length !== options.arrayLength) throw new Error("Invalid array length");
  
  let hitValue = false;
  let nFilled = 0;
  let lastValue = null;
  let allValues = new Set();
  
  for (let i = arr.length - 1; i >= 0; i--) {
    let value = arr[i];
    
    if (value == null && lastValue != null && (options.requireAscending || !options.allowDiscontiguousNulls)) throw new Error("Discontiguous null values");
    if (value != null && lastValue != null && !(value < lastValue) && options.requireAscending) throw new Error("Values are not sorted");
    
    if (value != null && !hitValue) {
      hitValue = true;
      nFilled = i + 1;
    }
    
    if (options.requireAscending) {
      if (lastValue != null) {
        if (value == null || value >= lastValue) {
          throw new Error ("Values are not sorted");
        }
      }
    }
    lastValue = value;
  }
  
  if (options.requireDistinct) {
    for (let i = 0; i < nFilled; i++) {
      let value = arr[i];
      if (allValues.has(value)) throw new Error("Duplicate value");
      allValues.add(value);
    }
  }
  
  if (nFilled > options.maxFilled) throw new Error("Too many filled values");
  if (nFilled < options.minFilled) throw new Error("Too few filled values");
  
}

function filledCount(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] != null) return i + 1;
  }
  return 0;
}
