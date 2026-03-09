// Custom Jest transformer that strips node: protocol prefixes from require() calls
// in CJS files. Needed because Jest 26's runtime doesn't support the node: protocol
// used by newer @aws-sdk/@smithy packages.
module.exports = {
  process(src) {
    return src.replace(/require\(['"]node:([^'"]+)['"]\)/g, 'require("$1")');
  },
};
