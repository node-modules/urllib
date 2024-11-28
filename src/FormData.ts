import path from 'node:path';
import _FormData from 'form-data';

export class FormData extends _FormData {
  _getContentDisposition(value: any, options: any) {
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
    } else if (value.readable && value.hasOwnProperty('httpVersion')) {
      // or try http response
      filename = path.basename(value.client._httpMessage.path || '');
    }

    if (filename) {
      // https://datatracker.ietf.org/doc/html/rfc6266#section-4.1
      // support non-ascii filename
      contentDisposition = 'filename="' + filename + '"; filename*=UTF-8\'\'' + encodeURIComponent(filename);
    }

    return contentDisposition;
  }
}
