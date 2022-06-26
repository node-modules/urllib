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
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
