# Verifying b-tree

The b-tree data structure is notoriously complex to write and maintain, so it's important to have a rigorous testing
regime to verify its implementation.

b-tree has a fuzzer that randomly generates and records actions on a b-tree and does those operations in parallel on
a simple alternative implementation. At each step, the fuzzer code does a deep inspection of the b-tree data structure
to ensure that it is valid. Then, it checks it against a parallel implementation ensure that it produces correct results.

The fuzzer also performs the same suite of tests on ArrayTree.

To invoke the fuzzer, run fuzzer.js. It runs indefinitely and reports any errors it finds.
