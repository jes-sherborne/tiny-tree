// Returns the largest `i` from the sorted array `arr` such that `arr[i] <= value`;
export function indexAtOrBelow(arr, value) {
  let i, lo, hi;
  
  if (!arr.length || arr[0] > value) {
    return -1;
  }
  if (arr[arr.length - 1] <= value) {
    return arr.length - 1;
  }
  
  lo = 0;
  hi = arr.length - 1;
  
  while (hi - lo > 1) {
    i = lo + ((hi - lo) >> 1);
    if (arr[i] > value) {
      hi = i;
    } else {
      lo = i;
    }
  }
  
  return lo;
}

// Returns the smallest `i` from the sorted array `arr` such that `arr[i] >= value`;
export function indexAtOrAbove(arr, value) {
  if (!arr.length) return -1;
  
  if (arr[0] > value) return 0;
  
  if (arr[arr.length - 1] < value) return -1;
  
  let lo = 0;
  let hi = arr.length - 1;
  
  while (hi - lo > 1) {
    let i = lo + ((hi - lo) >> 1);
    if (arr[i] > value) {
      hi = i;
    } else {
      lo = i;
    }
  }
  
  if (arr[lo] === value) return lo;
  return hi;
}

// Returns `i` from the sorted array `arr` such that `arr[i] === value`;
export function indexOf(arr, value) {
  if (!arr.length) return -1;
  
  let lo = 0;
  let hi = arr.length - 1;
  
  while (hi - lo > 1) {
    let i = lo + ((hi - lo) >> 1);
    if (arr[i] > value) {
      hi = i;
    } else {
      lo = i;
    }
  }
  
  if (arr[lo] === value) return lo;
  if (arr[hi] === value) return hi;
  return -1;
}
