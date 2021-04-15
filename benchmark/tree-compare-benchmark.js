import Benchmark from "benchmark";
import * as devUtil from "../dev-util/dev-util.js"
import {ArrayTree, BTree} from "../index.js";

const N_RANGES = 1000;

for (let testN of [10000, 100000, 1000000]) {
  runBenchmark({nItems: testN, nRanges: N_RANGES});
}

function runBenchmark(options) {
  
  let startKeys = [];
  for (let i = 0; i < options.nItems; i++) {
    startKeys.push("K-" + devUtil.randomString() + "-" + i);
  }
  startKeys.sort(devUtil.simpleSort);
  
  let startData = [];
  for (let i = 0; i < options.nItems; i++) {
    startData.push([startKeys[i], "V" + devUtil.randomString()]);
  }
  
  devUtil.shuffleArrayInPlace(startKeys);
  let nToKeep = options.nItems >> 1;
  let deleteKeys = startKeys.slice(nToKeep);
  
  let addData = [];
  let addKeys = [];
  for (let i = options.nItems; i < options.nItems + nToKeep; i++) {
    let key = "K-" + devUtil.randomString() + "-" + i;
    addKeys.push(key);
    addData.push([key, "V" + devUtil.randomString()])
  }
  
  let endKeys = startKeys.slice(0, nToKeep).concat(addKeys);
  endKeys.sort(devUtil.simpleSort);
  
  const keyRanges1000 = devUtil.generateKeyRanges(options.nRanges, 1000, endKeys.length, endKeys);
  const indexRanges1000 = devUtil.generateIndexRanges(options.nRanges, 1000, endKeys.length);
  
  const keyRanges100 = devUtil.generateKeyRanges(options.nRanges, 100, endKeys.length, endKeys);
  const indexRanges100 = devUtil.generateIndexRanges(options.nRanges, 100, endKeys.length);
  
  const randomKeys = devUtil.generateKeyRanges(options.nRanges, 1, endKeys.length, endKeys).map(_ => _.min);
  const randomIndexes = devUtil.generateIndexRanges(options.nRanges, 1, endKeys.length).map(_ => _[0]);
  
  
  const btree = new BTree();
  const arrayTree = new ArrayTree();
  
  let suite  = new Benchmark.Suite();
  
  suite.add(`Bulk load ${options.nItems} items, add/delete ${deleteKeys.length} items in BTree`, function() {
    testLoad(btree, startData, deleteKeys, addData);
  });
  
  suite.add(`Get ${options.nRanges} values by key`, function() {getValuesByKey(btree, randomKeys)});
  suite.add(`Get ${options.nRanges} values by index`, function() {getValuesByIndex(btree, randomIndexes)});
  
  suite.add(`Query ${options.nRanges} value ranges of size 100 by key`, function() {queryValuesByKey(btree, keyRanges100)});
  suite.add(`Query ${options.nRanges} value ranges of size 100 by index`, function() {queryValuesByIndex(btree, indexRanges100)});
  
  suite.add(`Query ${options.nRanges} value ranges of size 1000 by key`, function() {queryValuesByKey(btree, keyRanges1000)});
  suite.add(`Query ${options.nRanges} value ranges of size 1000 by index`, function() {queryValuesByIndex(btree, indexRanges1000)});
  
  suite.add(`Bulk load ${options.nItems} items, add/delete ${deleteKeys.length} items in ArrayTree`, function() {
    testLoad(arrayTree, startData, deleteKeys, addData);
  });
  
  suite.add(`Get ${options.nRanges} values by key`, function() {getValuesByKey(arrayTree, randomKeys)});
  suite.add(`Get ${options.nRanges} values by index`, function() {getValuesByIndex(arrayTree, randomIndexes)});
  
  suite.add(`Query ${options.nRanges} value ranges of size 100 by key`, function() {queryValuesByKey(arrayTree, keyRanges100)});
  suite.add(`Query ${options.nRanges} value ranges of size 100 by index`, function() {queryValuesByIndex(arrayTree, indexRanges100)});
  
  suite.add(`Query ${options.nRanges} value ranges of size 1000 by key`, function() {queryValuesByKey(arrayTree, keyRanges1000)});
  suite.add(`Query ${options.nRanges} value ranges of size 1000 by index`, function() {queryValuesByIndex(arrayTree, indexRanges1000)});
  
  suite.on('error', event => console.log(event.target.error));
  suite.on('cycle', event => console.log(String(event.target)));
  suite.run();
  
}

function testLoad(tree, startData, deleteKeys, addData) {
  tree.clear();
  tree.bulkLoad(startData);
  for (let i = 0; i < deleteKeys.length; i++) {
    tree.delete(deleteKeys[i]);
    tree.set(addData[i][0], addData[i][1]);
  }
}

function queryValuesByKey(tree, keyRanges) {
  for (let bounds of keyRanges) {
    let result = tree.toArray(bounds, true);
  }
}

function queryValuesByIndex(tree, indexRanges) {
  for (let bounds of indexRanges) {
    let result = tree.toArrayByIndex(bounds[0], bounds[1], true);
  }
}

function getValuesByKey(tree, keyList) {
  for (let key of keyList) {
    let result = tree.get(key);
  }
}

function getValuesByIndex(tree, indexList) {
  for (let index of indexList) {
    let result = tree.getByIndex(index);
  }
}
