
function simpleSort(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function randomString() {
  return Math.random().toString(36).slice(2);
}

function randomInteger(lb, ub) {
  return lb + Math.floor((ub - lb + 1) * Math.random());
}

function randomBoolean(pTrue) {
  return Math.random() < pTrue;
}

function deleteRandom(arr) {
  return arr.splice(randomInteger(0, arr.length - 1), 1)[0];
}

function getRandom(arr) {
  return arr[randomInteger(0, arr.length - 1)];
}

function uniqueRandomIntegers(start, n) {
  let result = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = start + i;
  }
  return shuffleArrayInPlace(result);
}

function shuffleArrayInPlace(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swap = arr[i];
    let iSwap = randomInteger(i + 1, n - 1);
    arr[i] = arr[iSwap];
    arr[iSwap] = swap;
  }
  return arr;
}


function generateKeyRanges(n, span, size, keys) {
  let result = [];
  for (let i = 0; i < n; i++) {
    let start = randomInteger(0, size - span);
    result.push({
      min: keys[start],
      maxInclusive: keys[start + span - 1]
    });
  }
  return result;
}

function generateIndexRanges(n, span, size) {
  let result = [];
  for (let i = 0; i < n; i++) {
    let start = randomInteger(0, size - span);
    result.push([start, span]);
  }
  return result;
}

exports.deleteRandom = deleteRandom;
exports.generateIndexRanges = generateIndexRanges;
exports.generateKeyRanges = generateKeyRanges;
exports.getRandom = getRandom;
exports.randomBoolean = randomBoolean;
exports.randomInteger = randomInteger;
exports.randomString = randomString;
exports.shuffleArrayInPlace = shuffleArrayInPlace;
exports.simpleSort = simpleSort;
exports.uniqueRandomIntegers = uniqueRandomIntegers;
