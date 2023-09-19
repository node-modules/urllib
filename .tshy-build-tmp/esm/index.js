import LRU from 'ylru';
import { HttpClient, HEADER_USER_AGENT } from './HttpClient.js';
let httpclient;
const domainSocketHttpclients = new LRU(50);
export async function request(url, options) {
    if (options?.socketPath) {
        let domainSocketHttpclient = domainSocketHttpclients.get(options.socketPath);
        if (!domainSocketHttpclient) {
            domainSocketHttpclient = new HttpClient({
                connect: { socketPath: options.socketPath },
            });
            domainSocketHttpclients.set(options.socketPath, domainSocketHttpclient);
        }
        return await domainSocketHttpclient.request(url, options);
    }
    if (!httpclient) {
        httpclient = new HttpClient({});
    }
    return await httpclient.request(url, options);
}
// export curl method is keep compatible with urlib.curl()
// ```ts
// import * as urllib from 'urllib';
// urllib.curl(url);
// ```
export async function curl(url, options) {
    return await request(url, options);
}
export { MockAgent, ProxyAgent, Agent, Dispatcher, setGlobalDispatcher, getGlobalDispatcher, } from 'undici';
// HttpClient2 is keep compatible with urlib@2 HttpClient2
export { HttpClient, HttpClient as HttpClient2, HEADER_USER_AGENT as USER_AGENT, } from './HttpClient.js';
export { IncomingHttpHeaders, } from './Response.js';
export default {
    request,
    curl,
    USER_AGENT: HEADER_USER_AGENT,
};
