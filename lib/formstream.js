'use strict';

var inherits = require('util').inherits;
var FormStream = require('formstream');

module.exports = SafeFormStream;

function SafeFormStream() {
  FormStream.call(this);
}

inherits(SafeFormStream, FormStream);

SafeFormStream.prototype._leading = function(disposition, type) {
  var escaped = {};
  for (var name in disposition) {
    // WHATWG multipart encoding escapes only CR, LF, and double quotes.
    // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart-form-data
    escaped[name] = String(disposition[name]).replace(/\r/g, '%0D').replace(/\n/g, '%0A').replace(/"/g, '%22');
  }
  return FormStream.prototype._leading.call(this, escaped, type);
};
