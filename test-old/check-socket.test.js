'use strict';

var major = parseInt(process.version.split('.')[0].substring(1));

if (major >= 8) {
  require('./check-socket');
}
