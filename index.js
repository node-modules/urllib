
module.exports = process.env.URLLIB_COV
  ? require('./lib-cov/urllib')
  : require('./lib/urllib');