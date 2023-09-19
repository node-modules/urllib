/// <reference types="node" resolution-mode="require"/>
import type { IncomingHttpHeaders as HTTPIncomingHttpHeaders } from 'node:http';
export type IncomingHttpHeaders = Omit<HTTPIncomingHttpHeaders, 'set-cookie'> & {
    'set-cookie'?: string | string[];
};
