import type { Except } from 'type-fest';
import type { IncomingHttpHeaders as HTTPIncomingHttpHeaders } from 'node:http';

// fix set-cookie type define https://github.com/nodejs/undici/pull/1893
export interface IncomingHttpHeaders extends Except<HTTPIncomingHttpHeaders, 'set-cookie'> {
  'set-cookie'?: string | string[];
}
