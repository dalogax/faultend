const users = require('./users');
const rules = require('./rules');
const traffic = require('./traffic');

module.exports = {
  ...users,
  ...rules,
  ...traffic
};
