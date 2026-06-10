// Minimal stub for path-scurry used by TypeORM's entity directory scanner.
// Unit tests inject repositories directly, so directory scanning is never called.

class PathScurry {
  constructor() {}
  lstat() { return Promise.resolve(null); }
  readdir() { return Promise.resolve([]); }
  walk() { return { [Symbol.asyncIterator]: async function* () {} }; }
}

class Path {
  constructor() {}
}

module.exports = { PathScurry, Path };
