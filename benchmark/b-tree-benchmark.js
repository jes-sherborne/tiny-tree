const benchmark = require('benchmark');
const devUtil = require("../dev-util/dev-util");
const BTree = require("../index").BTree;

const N_RANGES = 1000;

for (let testN of [10000, 1000000]) {
  for (let testBulk of [true, false]) {
    for (let testDegree of [3, 7, 15, 31, 63]) {
      runBenchmark({nItems: testN, nRanges: N_RANGES, degree: testDegree, bulk: testBulk});
    }
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
  
  const btree = new BTree({degree: options.degree});
  
  function loadData() {
    btree.clear();
    for (let item of data) {
      btree.set(item[0], item[1]);
    }
  }
  
  function bulkLoadData() {
    btree.clear();
    btree.bulkLoad(data);
  }
  
  function queryByKey(keyRanges) {
    for (let bounds of keyRanges) {
      let result = btree.toArray(bounds);
    }
  }
  
  function queryValuesByKey(keyRanges) {
    for (let bounds of keyRanges) {
      let result = btree.toArray(bounds, true);
    }
  }
  
  function queryByIndex(indexRanges) {
    for (let bounds of indexRanges) {
      let result = btree.toArrayByIndex(bounds[0], bounds[1]);
    }
  }
  
  function queryValuesByIndex(indexRanges) {
    for (let bounds of indexRanges) {
      let result = btree.toArrayByIndex(bounds[0], bounds[1], true);
    }
  }
  
  function getValuesByKey(keyList) {
    for (let key of keyList) {
      let result = btree.get(key);
    }
  }
  
  function getValuesByIndex(indexList) {
    for (let index of indexList) {
      let result = btree.getByIndex(index);
    }
  }
  
  let suite  = new benchmark.Suite();

  if (options.bulk) {
    
    data.sort(devUtil.simpleSort);
    
    suite.add(`Bulk load ${options.nItems} items in tree of degree ${options.degree}`, bulkLoadData, {onComplete: function() {  console.log(btree.getStats());}});
    
  } else {
    
    suite.add(`Load ${options.nItems} items in tree of degree ${options.degree} in random order`, loadData, {onComplete: function() {  console.log(btree.getStats());}});
    
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
