import { randomBytes, createHash } from 'crypto';
import { FixJSONCtlChars } from './Request';

const JSONCtlCharsMap = {
  '"': '\\"', // \u0022
  '\\': '\\\\', // \u005c
  '\b': '\\b', // \u0008
  '\f': '\\f', // \u000c
  '\n': '\\n', // \u000a
  '\r': '\\r', // \u000d
  '\t': '\\t', // \u0009
};
/* eslint no-control-regex: "off"*/
const JSONCtlCharsRE = /[\u0000-\u001F\u005C]/g;

function replaceOneChar(c: string) {
  return JSONCtlCharsMap[c] || '\\u' + (c.charCodeAt(0) + 0x10000).toString(16).substring(1);
}

function replaceJSONCtlChars(value: string) {
  return value.replace(JSONCtlCharsRE, replaceOneChar);
}

export function parseJSON(data: string, fixJSONCtlChars?: FixJSONCtlChars) {
  if (typeof fixJSONCtlChars === 'function') {
    data = fixJSONCtlChars(data);
  } else if (fixJSONCtlChars) {
    // https://github.com/node-modules/urllib/pull/77
    // remote the control characters (U+0000 through U+001F)
    data = replaceJSONCtlChars(data);
  }
  try {
    data = JSON.parse(data);
  } catch (err: any) {
    if (err.name === 'SyntaxError') {
      err.name = 'JSONResponseFormatError';
    }
    if (data.length > 1024) {
      // show 0~512 ... -512~end data
      err.message += ' (data json format: ' +
        JSON.stringify(data.slice(0, 512)) + ' ...skip... ' + JSON.stringify(data.slice(data.length - 512)) + ')';
    } else {
      err.message += ' (data json format: ' + JSON.stringify(data) + ')';
    }
    throw err;
  }
  return data;
}

export function sleep(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

function md5(s: string) {
  const sum = createHash('md5');
  sum.update(s, 'utf8');
  return sum.digest('hex');
}

const AUTH_KEY_VALUE_RE = /(\w{1,100})=["']?([^'"]+)["']?/;
let NC = 0;
const NC_PAD = '00000000';

export function digestAuthHeader(method: string, uri: string, wwwAuthenticate: string, userpass: string) {
  // WWW-Authenticate: Digest realm="testrealm@host.com",
  //                       qop="auth,auth-int",
  //                       nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093",
  //                       opaque="5ccc069c403ebaf9f0171e9517f40e41"
  // Authorization: Digest username="Mufasa",
  //                    realm="testrealm@host.com",
  //                    nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093",
  //                    uri="/dir/index.html",
  //                    qop=auth,
  //                    nc=00000001,
  //                    cnonce="0a4f113b",
  //                    response="6629fae49393a05397450978507c4ef1",
  //                    opaque="5ccc069c403ebaf9f0171e9517f40e41"
  // HA1 = MD5( "Mufasa:testrealm@host.com:Circle Of Life" )
  //      = 939e7578ed9e3c518a452acee763bce9
  //
  //  HA2 = MD5( "GET:/dir/index.html" )
  //      = 39aff3a2bab6126f332b942af96d3366
  //
  //  Response = MD5( "939e7578ed9e3c518a452acee763bce9:\
  //                   dcd98b7102dd2f0e8b11d0f600bfb0c093:\
  //                   00000001:0a4f113b:auth:\
  //                   39aff3a2bab6126f332b942af96d3366" )
  //           = 6629fae49393a05397450978507c4ef1
  const parts = wwwAuthenticate.split(',');
  const opts: Record<string, string> = {};
  for (const part of parts) {
    const m = part.match(AUTH_KEY_VALUE_RE);
    if (m) {
      opts[m[1]] = m[2].replace(/["']/g, '');
    }
  }

  if (!opts.realm || !opts.nonce) {
    return '';
  }

  let qop = opts.qop || '';
  const [ user, pass ] = userpass.split(':');

  let nc = String(++NC);
  nc = `${NC_PAD.substring(nc.length)}${nc}`;
  const cnonce = randomBytes(8).toString('hex');

  const ha1 = md5(`${user}:${opts.realm}:${pass}`);
  const ha2 = md5(`${method.toUpperCase()}:${uri}`);
  let s = `${ha1}:${opts.nonce}`;
  if (qop) {
    qop = qop.split(',')[0];
    s += `:${nc}:${cnonce}:${qop}`;
  }
  s += `:${ha2}`;
  const response = md5(s);
  let authstring = `Digest username="${user}", realm="${opts.realm}", nonce="${opts.nonce}", uri="${uri}", response="${response}"`;
  if (opts.opaque) {
    authstring += `, opaque="${opts.opaque}"`;
  }
  if (qop) {
    authstring += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  }
  return authstring;
}
