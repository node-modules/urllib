// fix set-cookie type define https://github.com/nodejs/undici/pull/1893
// keep the same type as undici IncomingHttpHeaders
export type IncomingHttpHeaders = Record<string, string | string[] | undefined>;
