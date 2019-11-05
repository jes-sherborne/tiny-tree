# TinyTree

Implements two different search tree data structures. ArrayTree provides extremely fast queries but slow updates. BTree
provides reasonably fast queries along with fast updates.

Both trees expose the same API, so you can use them interchangeably.

## Usage

### Creating a new tree

```javascript
// Node.js
const tinyTree = require("tinyTree");
const bTree = new tinyTree.BTree();
const arrayTree = new tinyTree.ArrayTree();
```

```html
<script type="text/javascript" src="//your.server.com/tiny-tree.min.js"></script>
<script type="text/javascript">
  const bTree = new tinyTree.BTree();
  const arrayTree = new tinyTree.ArrayTree();
</script>
```

##### Options

**BTree** can create trees of any degree; by default, it is of degree 15, which usually provides reasonable performance. You 
can change this by passing _options_ to the constructor. 

```javascript
const tree = new BTree({degree: 5});
```

**degree** (integer; default 15; min 3)—determines how many items are stored at each node. See the performance section 
below for guidance on setting the degree.

**ArrayTree** does not take any options.

### Adding/replacing entries

```javascript
tree.set(key, value);
```

Keys must be strings or numbers. They are compared with javascript's default comparison operators 
(`<`, `>`, `=`, etc).

Values can be any data type.

### Bulk loading items

```javascript
let mySortedData = [
  ["key-a", "value-for-key-a"],
  ["key-b", "value-for-key-b"],
  ["key-c", "value-for-key-c"],
  ["key-d", "value-for-key-d"],
];

tree.bulkLoad(mySortedData);
```

You can get substantially better loading time, query performance, and memory usage by bulk loading a sorted list of entries. Bulk 
loading is only allowed on empty trees.

The data must be a sorted array of key/value arrays as shown in the example.

### Removing entries

```javascript
tree.delete(key);
```

### Removing all entries

```javascript
tree.clear();
```

### Getting a single value by key or index

```javascript
tree.get(key);
// returns value for the given key or `undefined` if no value has been set for this key
```

```javascript
tree.getByIndex(4); // get the fifth entry from the sorted entries
```

Both functions return `undefined` if the index or key is not in the tree.

### Getting all entries in order

```javascript
// get all entries
tree.toArray();
// output [["key-a", "value-a"], ["key-b", "value-b"], ["key-c", "value-c"], ...]

// get all values (no keys)
tree.toArray(null, true);
// output ["value-a", "value-b", "value-c", ...]
```

Note that the first argument to `toArray` is an optional bounds. See below.

### Getting a range of entries based on key

You can limit your results to just the keys in a certain range. BTrees and ArrayTrees are especially well-suited to this kind of query.

**tree.toArray(bounds __optional object__, valuesOnly __optional boolean__)**—get key/value pairs or values based on bounds. 

When setting `bounds`, `min` is inclusive and `max` is exclusive. 
If you need to change this behavior, set `minExclusive` and/or `maxInclusive` instead. All min/max properties are 
optional. It is equivalent to set `min`/`minInclusive` and `max`/`maxExclusive`.

Examples: 

* `{min: 100, max: 200}`: 100 ≤ key < 200
* `{minInclusive: 100, max: 200}`: 100 ≤ key < 200
* `{minExclusive: 100, max: 200}`: 100 < key < 200
* `{min: 100, maxInclusive: 200}`: 100 ≤ key ≤ 200
* `{min: 100}`: 100 ≤ key
* `{max: 200}`: 200 < key

```javascript
// get all entries where key >= "key-a" and key < "key-c"
let bounds = {min: "key-a", max: "key-c"};
tree.toArray(bounds);
// output [["key-a", "value-a"], ["key-b", "value-b"]]

// get just values where key >= "key-a" and key < "key-c"
let bounds = {min: "key-a", max: "key-c"};
tree.toArray(bounds, true);
// output ["value-a", "value-b"]
```

### Getting a range of entries based on index (sort position)

**tree.toArrayByIndex(start, count, [valuesOnly])**

This works very much like `toArray`, but instead of querying by key, you are querying by sort position. This is useful
for determining the top N or bottom N entries.

```javascript
// get the top two entries
tree.toArrayByIndex(0, 2, true);
// output ["value-a", "value-b"]

// get the bottom two entries
tree.toArrayByIndex(tree.size - 3, 2, true);
// output ["value-y", "value-z"]
```

### Size and other statistics

```javascript
tree.size; // get total number of values stored
```

```javascript
tree.getStats(); // get detailed information about the BTree
```

If you are trying to tune your tree for performance, detailed statistics might be helpful. 

For **BTree**, `getStats` returns an object with the following fields:
* **degree**—the BTree's degree, as set in the constructor.
* **size**—the total number of values stored. This is the same value as `tree.size`.
* **depth**—the depth of the tree structure. Deeper trees can take longer to traverse. In general, trees with higher degrees will be shallower.
* **fillFactor**—the proportion of keys that are non-empty. A `fillFactor` of 1 means that all keys are filled and there is no empty space. For a large tree with random data, values of 0.6 to 0.7 are typical.
* **nodes**—the total number of nodes in the tree. In general, trees with higher degrees will need fewer nodes.
* **saturationFactor**—the proportion of nodes that are completely filled. Adding keys to a saturated node will cause the tree to rebalance. Conversely, trees with a low saturation factor can accommodate new entries with higher performance. In general, trees of higher degree have a lower saturation factor.
* **keySlots**—the total number of keys that the tree can store with its current node configuration.
* **filledKeySlots**—the number of these slots that are filled. Note that `fillFactor = filledKeySlots / keySlots`.
* **saturatedNodes**—the number of saturated nodes. Note that `saturationFactor = saturatedNodes / nodes`.

For **ArrayTree**, `getStats` is included mostly for compatibility and returns an object with the following field:
* **size**—the total number of values stored. This is the same value as `tree.size`.

## Performance

For BTrees,  degree affects performance in a complicated way that depends on how you access data (especially the number of items you
query at a time). In general, higher-degree trees have slower inserts/deletes but faster lookups. The following table 
also illustrates the substantial benefits of bulk loading.

On a 2017 15" MacBook Pro, here are operations per second for typical operations. 

| Test                                       | Degree 3   | Degree 7   | Degree 15  | Degree 31  | Degree 63  |
|:-------------------------------------------|:-----------|:-----------|:-----------|:-----------|:-----------|
| **Bulk load 10,000 items**                 | 142 ops/s  | 232 ops/s  | 216 ops/s  | 159 ops/s  | 91 ops/s   |
| Fill factor                                | 99.9%      | 99.8%      | 99.7%      | 99.5%      | 99.0%      |
| Depth                                      | 9          | 5          | 4          | 3          | 3          |
| Get 1000 items by key                      | 2,329      | 2,855      | 2,469      | 1,887      | 985        |
| Get 1000 items by index                    | 5,317      | 8,659      | 11,038     | 12,504     | 9,649      |
| Query 1000 ranges of size 100 by key       | 212        | 336        | 352        | 327        | 237        |
| Query 1000 ranges of size 100 by index     | 259        | 446        | 521        | 465        | 427        |
| Query 1000 ranges of size 1000 by key      | 28         | 50         | 61         | 60         | 64         |
| Query 1000 ranges of size 1000 by index    | 29         | 51         | 64         | 72         | 75         |
| **Load 10,000 items in random order**      | 82 ops/s   | 150 ops/s  | 162 ops/s  | 133 ops/s  |            |
| Fill factor                                | 67.0%      | 68.3%      | 69.4%      | 69.2%      | 69.5%      |
| Depth                                      | 11         | 6          | 4          | 3          | 3          |
| Get 1000 items by key                      | 2,289      | 2,646      | 2,392      | 1,749      | 1,131      |
| Get 1000 items by index                    | 3,932      | 7,443      | 9,708      | 10,981     | 8,889      |
| Query 1000 ranges of size 100 by key       | 132        | 233        | 274        | 273        | 218        |
| Query 1000 ranges of size 100 by index     | 148        | 284        | 363        | 410        | 357        |
| Query 1000 ranges of size 1000 by key      | 17         | 33         | 43         | 50         | 51         |
| Query 1000 ranges of size 1000 by index    | 17         | 34         | 45         | 53         | 58         |
| **Bulk load 1,000,000 items**              | 0.57 ops/s | 0.74 ops/s | 0.72 ops/s | 0.57 ops/s | 0.42 ops/s |
| Fill factor                                | 100%       | 100%       | 100%       | 100%       | 100%       |
| Depth                                      | 13         | 8          | 6          | 5          | 4          |
| Get 1000 items by key                      | 329        | 420        | 305        | 186        | 114        |
| Get 1000 items by index                    | 1,694      | 2,518      | 2,875      | 2,620      | 2,092      |
| Query 1000 ranges of size 100 by key       | 49         | 84         | 86         | 69         | 46         |
| Query 1000 ranges of size 100 by index     | 61         | 146        | 229        | 342        | 294        |
| Query 1000 ranges of size 1000 by key      | 7.1        | 16         | 23         | 27         | 22         |
| Query 1000 ranges of size 1000 by index    | 7.5        | 18         | 29         | 37         | 41         |
| **Load 1,000,000 items in random order**   | 0.17 ops/s | 0.25 ops/s | 0.25 ops/s | 0.21 ops/s | 0.15 ops/s |
| Fill factor                                | 67.0%      | 68.1%      | 68.6%      | 69.2%      | 69.4%      |
| Depth                                      | 16         | 9          | 6          | 5          | 4          |
| Get 1000 items by key                      | 310        | 386        | 354        | 226        | 147        |
| Get 1000 items by index                    | 614        | 1,542      | 1,998      | 2,271      | 2,364      |
| Query 1000 ranges of size 100 by key       | 22         | 48         | 68         | 66         | 51         |
| Query 1000 ranges of size 100 by index     | 24         | 60         | 116        | 171        | 221        |
| Query 1000 ranges of size 1000 by key      | 2.7        | 6.7        | 13         | 16         | 20         |
| Query 1000 ranges of size 1000 by index    | 2.8        | 6.9        | 14         | 22         | 29         |

ArrayTree provides very close to the theoretical best-case performance for queries. If your data changes rarely,
you can get an enormous boost in performance by using it. Also, if your data is fairly small (less than 10,000 
items), you should consider using it even if your data is volatile, provided that queries are significantly more common
than updates.

ArrayTree is especially efficient at getting contiguous arrays of values, where it achieves nearly the same performance
as raw array access.

| Test                                               | BTree (degree 15)  | ArrayTree          | Speedup (slowdown) |
|:---------------------------------------------------|:-------------------|:-------------------|:-------------------|
| **Bulk load 10k items, add/remove 5k items**       | 71 ops/s           | 37 ops/s           | (1.9x)             |
| Get 1000 items by key                              | 2,100              | 3,700              | 1.8x               |
| Get 1000 items by index                            | 9,800              | 540,000            | 55x                |
| Query 1000 ranges of size 100 by key               | 300                | 1,500              | 5x                 |
| Query 1000 ranges of size 100 by index             | 450                | 12,000             | 34x                |
| Query 1000 ranges of size 1000 by key              | 55                 | 730                | 13x                |
| Query 1000 ranges of size 1000 by index            | 59                 | 1,400              | 24x                |
| **Bulk load 100k items, add/remove 50k items**     | 3.0 ops/s          | 0.07 ops/s         | (42x)              |
| Get 1000 items by key                              | 880                | 1,600              | 1.8x               |
| Get 1000 items by index                            | 4,700              | 300,000            | 64x                |
| Query 1000 ranges of size 100 by key               | 130                | 430                | 3.3x               |
| Query 1000 ranges of size 100 by index             | 340                | 1,900              | 5.6x               |
| Query 1000 ranges of size 1000 by key              | 31                 | 160                | 5.2x               |
| Query 1000 ranges of size 1000 by index            | 41                 | 580                | 14x                |
| **Bulk load 1M items, add/remove 500k items**      | 0.16 ops/s         | Did not finish     | -                  |
| Get 1000 items by key                              | 305                | n/a                | -                  |
| Get 1000 items by index                            | 2,069              | n/a                | -                  |
| Query 1000 ranges of size 100 by key               | 71                 | n/a                | -                  |
| Query 1000 ranges of size 100 by index             | 150                | n/a                | -                  |
| Query 1000 ranges of size 1000 by key              | 17                 | n/a                | -                  |
| Query 1000 ranges of size 1000 by index            | 20                 | n/a                | -                  |


