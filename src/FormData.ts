import path from 'node:path';

import _FormData from 'form-data';

// eslint-disable-next-line
const NON_ASCII_RE = /[^\x00-\x7F]/i;

export class FormData extends _FormData {
  _getContentDisposition(value: any, options: any): string | undefined {
    // support non-ascii filename
    // https://github.com/form-data/form-data/pull/571
    let filename;
    let contentDisposition;

    if (typeof options.filepath === 'string') {
      // custom filepath for relative paths
      filename = path.normalize(options.filepath).replace(/\\/g, '/');
    } else if (options.filename || value.name || value.path) {
      // custom filename take precedence
      // formidable and the browser add a name property
      // fs- and request- streams have path property
      filename = path.basename(options.filename || value.name || value.path);
    } else if (value.readable && Object.hasOwn(value, 'httpVersion')) {
      // or try http response
      filename = path.basename(value.client._httpMessage.path || '');
    }

    if (filename) {
      // WHATWG multipart encoding escapes only CR, LF, and double quotes in filenames.
      // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart-form-data
      const escapedFilename = filename.replace(/\r/g, '%0D').replace(/\n/g, '%0A').replace(/"/g, '%22');
      contentDisposition = 'filename="' + escapedFilename + '"';
      if (NON_ASCII_RE.test(filename)) {
        // Preserve legacy filename* support for compatibility, although RFC 7578 forbids it in multipart uploads.
        contentDisposition += "; filename*=UTF-8''" + encodeURIComponent(filename);
      }
    }

    return contentDisposition;
  }
}
