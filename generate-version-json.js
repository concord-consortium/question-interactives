const {name, version , description} = require('./package.json');

const now = new Date();

module.exports = () => {
  return {
    name,
    version,
    description,
    buildDate: now.toString(),
    buildTimestamp: now.getTime()
  }
};
