/// <reference types="node" resolution-mode="require"/>
import { LookupFunction } from 'node:net';
import { Agent, Dispatcher, buildConnector } from 'undici';
export type CheckAddressFunction = (ip: string, family: number | string) => boolean;
export type HttpAgentOptions = {
    lookup?: LookupFunction;
    checkAddress?: CheckAddressFunction;
    connect?: buildConnector.BuildOptions;
};
export declare class HttpAgent extends Agent {
    #private;
    constructor(options: HttpAgentOptions);
    dispatch(options: Agent.DispatchOptions, handler: Dispatcher.DispatchHandlers): boolean;
}
