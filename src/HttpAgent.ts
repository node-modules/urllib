import dns from 'node:dns';
import { LookupFunction, isIP } from 'node:net';
import {
  Agent,
  Dispatcher,
  buildConnector,
} from 'undici';
import { BaseAgent, BaseAgentOptions } from './BaseAgent.js';

export type CheckAddressFunction = (ip: string, family: number | string, hostname: string) => boolean;

export interface HttpAgentOptions extends BaseAgentOptions {
  lookup?: LookupFunction;
  checkAddress?: CheckAddressFunction;
  connect?: buildConnector.BuildOptions,
  allowH2?: boolean;
}

class IllegalAddressError extends Error {
  hostname: string;
  ip: string;
  family: number;

  constructor(hostname: string, ip: string, family: number) {
    const message = 'illegal address';
    super(message);
    this.name = this.constructor.name;
    this.hostname = hostname;
    this.ip = ip;
    this.family = family;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class HttpAgent extends BaseAgent {
  #checkAddress?: CheckAddressFunction;

  constructor(options: HttpAgentOptions) {
    /* eslint node/prefer-promises/dns: off*/
    const { lookup = dns.lookup, ...baseOpts } = options;

    const lookupFunction: LookupFunction = (hostname, dnsOptions, callback) => {
      lookup(hostname, dnsOptions, (err, ...args: any[]) => {
        // address will be array on Node.js >= 20
        const address = args[0];
        const family = args[1];
        if (err) return (callback as any)(err, address, family);
        if (options.checkAddress) {
          // dnsOptions.all set to default on Node.js >= 20, dns.lookup will return address array object
          if (typeof address === 'string') {
            if (!options.checkAddress(address, family, hostname)) {
              err = new IllegalAddressError(hostname, address, family);
            }
          } else if (Array.isArray(address)) {
            const addresses = address as { address: string, family: number }[];
            for (const addr of addresses) {
              if (!options.checkAddress(addr.address, addr.family, hostname)) {
                err = new IllegalAddressError(hostname, addr.address, addr.family);
                break;
              }
            }
          }
        }
        (callback as any)(err, address, family);
      });
    };
    super({
      ...baseOpts,
      connect: { ...options.connect, lookup: lookupFunction, allowH2: options.allowH2 },
    });
    this.#checkAddress = options.checkAddress;
  }

  dispatch(options: Agent.DispatchOptions, handler: Dispatcher.DispatchHandler): boolean {
    if (this.#checkAddress && options.origin) {
      const originUrl = typeof options.origin === 'string' ? new URL(options.origin) : options.origin;
      let hostname = originUrl.hostname;
      // [2001:db8:2de::e13] => 2001:db8:2de::e13
      if (hostname.startsWith('[') && hostname.endsWith(']')) {
        hostname = hostname.substring(1, hostname.length - 1);
      }
      const family = isIP(hostname);
      if (family === 4 || family === 6) {
        // if request hostname is ip, custom lookup won't execute
        if (!this.#checkAddress(hostname, family, hostname)) {
          throw new IllegalAddressError(hostname, hostname, family);
        }
      }
    }
    return super.dispatch(options, handler);
  }
}
