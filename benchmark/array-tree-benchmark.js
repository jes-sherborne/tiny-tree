import Benchmark from "benchmark";
import * as devUtil from "../dev-util/dev-util.js"
import {ArrayTree} from "../index.js";

const N_RANGES = 1000;

for (let testN of [10000, 1000000]) {
  for (let testBulk of [true, false]) {
    runBenchmark({nItems: testN, nRanges: N_RANGES, bulk: testBulk});
  }
}

function runBenchmark(options) {
  
  const data = [];
  const keys = [];
  for (let i = 0; i < options.nItems; i++) {
    let key = "K-" +  devUtil.randomString() + "-" + i;
    keys.push(key);
    data.push([key, "V" + devUtil.randomString()])
  }
  keys.sort(devUtil.simpleSort);
  
  const keyRanges1000 = devUtil.generateKeyRanges(options.nRanges, 1000, data.length, keys);
  const indexRanges1000 = devUtil.generateIndexRanges(options.nRanges, 1000, data.length);
  
  const keyRanges100 = devUtil.generateKeyRanges(options.nRanges, 100, data.length, keys);
  const indexRanges100 = devUtil.generateIndexRanges(options.nRanges, 100, data.length);
  
  const randomKeys = devUtil.generateKeyRanges(options.nRanges, 1, data.length, keys).map(_ => _.min);
  const randomIndexes = devUtil.generateIndexRanges(options.nRanges, 1, data.length).map(_ => _[0]);
  
  const tree = new ArrayTree();
  
  function loadData() {
    tree.clear();
    for (let item of data) {
      tree.set(item[0], item[1]);
    }
  }
  
  function bulkLoadData() {
    tree.clear();
    tree.bulkLoad(data);
  }
  
  function queryByKey(keyRanges) {
    for (let bounds of keyRanges) {
      let result = tree.toArray(bounds);
    }
  }
  
  function queryValuesByKey(keyRanges) {
    for (let bounds of keyRanges) {
      let result = tree.toArray(bounds, true);
    }
  }
  
  function queryByIndex(indexRanges) {
    for (let bounds of indexRanges) {
      let result = tree.toArrayByIndex(bounds[0], bounds[1]);
    }
  }
  
  function queryValuesByIndex(indexRanges) {
    for (let bounds of indexRanges) {
      let result = tree.toArrayByIndex(bounds[0], bounds[1], true);
    }
  }
  
  function getValuesByKey(keyList) {
    for (let key of keyList) {
      let result = tree.get(key);
    }
  }
  
  function getValuesByIndex(indexList) {
    for (let index of indexList) {
      let result = tree.getByIndex(index);
    }
  }
  
  let suite  = new Benchmark.Suite();

  if (options.bulk) {
    
    data.sort((a, b) => {
      if (a[0] < b[0]) return -1;
      if (a[0] > b[0]) return 1;
      return 0;
    });
    
    suite.add(`Bulk load ${options.nItems} items in tree`, bulkLoadData, {onComplete: function() {  console.log(tree.getStats());}});
    
  } else {
    
    suite.add(`Load ${options.nItems} items in tree`, loadData, {onComplete: function() {  console.log(tree.getStats());}});
    
  }
  
  suite.add(`Get ${options.nRanges} values by key`, function() {getValuesByKey(randomKeys)});
  suite.add(`Get ${options.nRanges} values by index`, function() {getValuesByIndex(randomIndexes)});
  
  suite.add(`Query ${options.nRanges} ranges of size 100 by key`, function() {queryByKey(keyRanges100)});
  suite.add(`Query ${options.nRanges} value ranges of size 100 by key`, function() {queryValuesByKey(keyRanges100)});
  
  suite.add(`Query ${options.nRanges} ranges of size 100 by index`, function() {queryByIndex(indexRanges100)});
  suite.add(`Query ${options.nRanges} value ranges of size 100 by index`, function() {queryValuesByIndex(indexRanges100)});
  
  suite.add(`Query ${options.nRanges} ranges of size 1000 by key`, function() {queryByKey(keyRanges1000)});
  suite.add(`Query ${options.nRanges} value ranges of size 1000 by key`, function() {queryValuesByKey(keyRanges1000)});
  
  suite.add(`Query ${options.nRanges} ranges of size 1000 by index`, function() {queryByIndex(indexRanges1000)});
  suite.add(`Query ${options.nRanges} value ranges of size 1000 by index`, function() {queryValuesByIndex(indexRanges1000)});

  suite.on('error', event => console.log(event.target.error));
  suite.on('cycle', event => console.log(String(event.target)));
  suite.run();
}
