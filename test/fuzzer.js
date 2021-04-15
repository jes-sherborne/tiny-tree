import {ArrayTree, BTree} from "../index.js";
import verify from "./verify-structure.js";
import KvTestStore from "./kv-test-store.js";
import * as devUtil from "../dev-util/dev-util.js";

const APPROXIMATE_N = 500;
const MIN_DEGREE = 3;
const MAX_DEGREE = 9;
const N_QUERIES = 10;

function runFuzzer(n, type, degree, actions) {
  let tree;
  
  actions.push({type: "start", treeType: type, n: n, degree: degree});

  switch (type) {
    case "BTree":
      console.log("BTree n-" + n + " | degree-" + degree);
      tree = new BTree({degree: degree});
      break;
    case "ArrayTree":
      console.log("ArrayTree n-" + n);
      tree = new ArrayTree();
      break;
    default:
      throw new Error("Unexpected type");
  }
  const kv = new KvTestStore();
  
  const nIterations = (3 + Math.random()) * n;
  const maxLength = 2 * n;
  const maxKeys = maxLength;
  const keys = [];
  
  for (let i = 1; i <= maxKeys; i++) {
    keys.push(i);
  }
  
  for (let i = 0; i < nIterations; i++) {
    if (i === 0 && devUtil.randomBoolean(0.5)) {
      let bulkData = [];
      for (let i = 0; i < n; i++) {
        bulkData.push(generateRandomItem(keys));
      }
      bulkData.sort((a, b) => {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
      });
      
      actions.push({type: "bulkLoad", data: bulkData});
      tree.bulkLoad(bulkData);
      for (let item of bulkData) {
        kv.set(item[0], item[1]);
      }
    } else {
      let pDelete = kv.size / maxLength;
  
      if (devUtil.randomBoolean(pDelete)) {
    
        let deleted = kv.deleteRandom();
        actions.push({type: "delete", key: deleted[0]});
        tree.delete(deleted[0]);
        kv.delete(deleted[0]);
        keys.push(deleted[0]);
        
      } else {
    
        if (devUtil.randomBoolean(pDelete)) {
      
          // Replace existing item
          let changed = kv.getRandom();
          changed[1] = devUtil.randomString();
          kv.set(changed[0], changed[1]);
          actions.push({type: "set", key: changed[0], value: changed[1]});
          tree.set(changed[0], changed[1]);
      
        } else {
      
          let newItem = generateRandomItem(keys);
          actions.push({type: "set", key: newItem[0], value: newItem[1]});
          tree.set(newItem[0], newItem[1]);
      
          kv.set(newItem[0], newItem[1]);
        }
      }
    }
    
    if (tree instanceof BTree) verify(tree);
    
    let reference = kv.toArray();
    resultArraysAreEqual(reference, tree.toArray());
    
    if (kv.size) {
      for (let q = 0; q < N_QUERIES; q++) {
        let iStart = devUtil.randomInteger(0, reference.length - 1);
        let iEnd = devUtil.randomInteger(iStart, reference.length - 1);
        let n = iEnd - iStart + 1;
        
        actions.push({type: "getByIndex", index: iStart});
        innerArraysAreEqual([kv.getByIndex(iStart)], [tree.getByIndex(iStart)]);
  
        actions.push({type: "getByKey", key: reference[iStart][0]});
        innerArraysAreEqual([kv.get(reference[iStart][0])], [tree.get(reference[iStart][0])]);
        
        actions.push({type: "queryByIndex", start: iStart, count: n, valuesOnly: false});
        resultArraysAreEqual(kv.toArrayByIndex(iStart, n), tree.toArrayByIndex(iStart, n));
  
        actions.push({type: "queryByIndex", start: iStart, count: n, valuesOnly: true});
        innerArraysAreEqual(kv.toArrayByIndex(iStart, n, true), tree.toArrayByIndex(iStart, n, true));
        
        let bounds = {};
        
        switch (devUtil.randomInteger(0, 3)) {
          case 0:
            break;
          case 1:
            bounds.min = reference[iStart][0];
            break;
          case 2:
            bounds.minInclusive = reference[iStart][0];
            break;
          case 3:
            bounds.minExclusive = reference[iStart][0];
            break;
        }
  
        switch (devUtil.randomInteger(0, 3)) {
          case 0:
            break;
          case 1:
            bounds.max = reference[iEnd][0];
            break;
          case 2:
            bounds.maxInclusive = reference[iEnd][0];
            break;
          case 3:
            bounds.maxExclusive = reference[iEnd][0];
            break;
        }
  
        actions.push({type: "queryByBounds", bounds: bounds, valuesOnly: false});
        resultArraysAreEqual(kv.toArray(bounds), tree.toArray(bounds));
  
        actions.push({type: "queryByBounds", bounds: bounds, valuesOnly: true});
        innerArraysAreEqual(kv.toArray(bounds, true), tree.toArray(bounds, true));
        
      }
    }
  }
  console.log(tree.getStats());
}

function generateRandomItem(keys) {
  return [devUtil.deleteRandom(keys), devUtil.randomString()];
}

function replayActions(actions) {
  let tree, kv, r1, r2;
  
  for (let i = 0; i < actions.length; i++) {
    let action = actions[i];
  
    console.log(action);
    
    if (i === actions.length - 1) {
      console.log("****last action****");
    }
    switch (action.type) {
      case "start":
        kv = new KvTestStore();
        if (action.treeType === "BTree") {
          tree = new BTree({degree: action.degree});
        } else if (action.treeType === "ArrayTree") {
          tree = new ArrayTree();
        }
        break;
      case "bulkLoad":
        for (let item of action.data) {
          kv.set(item[0], item[1]);
        }
        tree.bulkLoad(action.data);
        break;
      case "set":
        kv.set(action.key, action.value);
        tree.set(action.key, action.value);
        break;
      case "delete":
        kv.delete(action.key);
        tree.delete(action.key);
        break;
      case "getByIndex":
        r1 = kv.getByIndex(action.index);
        r2 = tree.getByIndex(action.index);
        break;
      case "queryByIndex":
        r1 = kv.toArrayByIndex(action.start, action.count, action.valuesOnly);
        r2 = tree.toArrayByIndex(action.start, action.count, action.valuesOnly);
        break;
      case "getByKey":
        r1 = kv.get(action.key);
        r2 = tree.get(action.key);
        break;
      case "queryByBounds":
        r1 = kv.toArray(action.bounds, action.valuesOnly);
        r2 = tree.toArray(action.bounds, action.valuesOnly);
        break;
      default:
        throw new Error("Unexpected action");
    }
  }
}

while (true) {
  let actions = [];
  try {
    runFuzzer(devUtil.randomInteger(1, APPROXIMATE_N), devUtil.getRandom(["BTree", "ArrayTree"]), devUtil.randomInteger(MIN_DEGREE, MAX_DEGREE), actions);
  } catch(e) {
    console.log(e);
    replayActions(actions);
    break;
  }
}

function resultArraysAreEqual(a1, a2) {
  if (a1.length !== a2.length) throw new Error("Lengths do not match");
  for (let i = 0; i < a1.length; i++) {
    innerArraysAreEqual(a1[i], a2[i]);
  }
}

function innerArraysAreEqual(a1, a2) {
  if (!Array.isArray(a1)) throw new Error ("Invalid entry");
  if (!Array.isArray(a2)) throw new Error ("Invalid entry");
  if (a1.length !== a2.length) throw new Error ("Lengths do not match");
  for (let j = 0; j < a1.length; j++) {
    if (a1[j] !== a2[j]) throw new Error("Entries don't match");
  }
}