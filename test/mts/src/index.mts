import { request } from "urllib";
const responseObj = await request("test");

type IsAny<T, Y, N> = 0 extends (1 & T) ? Y : N;
(x: IsAny<number, true, never>) => x; // never
(x: IsAny<any, true, never>) => x; // true

(x: IsAny<typeof responseObj, true, never>) => x; // true
