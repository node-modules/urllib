import { request, type IncomingHttpHeaders } from 'urllib';

type IsAny<T, Y, N> = 0 extends 1 & T ? Y : N;

const responseObj = await request<{ ok: boolean }>('http://localhost');
const responseIsTyped: IsAny<typeof responseObj, never, true> = true;
const dataIsTyped: IsAny<typeof responseObj.data, never, true> = true;
const headers: IncomingHttpHeaders = responseObj.headers;
const ok: boolean = responseObj.data.ok;

console.log(responseIsTyped, dataIsTyped, headers, ok);
