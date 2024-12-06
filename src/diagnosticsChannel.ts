import diagnosticsChannel from 'node:diagnostics_channel';
import { performance } from 'node:perf_hooks';
import { debuglog } from 'node:util';
import { Socket } from 'node:net';
import { DiagnosticsChannel } from 'undici';
import symbols from './symbols.js';
import { globalId, performanceTime } from './utils.js';
import { asyncLocalStorage } from './asyncLocalStorage.js';
import { InternalStore } from './Response.js';

const debug = debuglog('urllib:DiagnosticsChannel');
let initedDiagnosticsChannel = false;
// https://undici.nodejs.org/#/docs/api/DiagnosticsChannel
// client --> server
// undici:request:create => { request }
//   -> [optional] undici:client:connected => { socket } [first request will create socket]
//   -> undici:client:sendHeaders => { socket, request }
//     -> undici:request:bodySent => { request }
//
// server --> client
// undici:request:headers => { request, response }
//   -> undici:request:trailers => { request, trailers }

function subscribe(name: string, listener: (message: unknown, channelName: string | symbol) => void) {
  diagnosticsChannel.subscribe(name, listener);
}

type SocketExtend = Socket & {
  [key: symbol]: string | number | Date | undefined;
};

function formatSocket(socket: SocketExtend) {
  if (!socket) return socket;
  return {
    localAddress: socket[symbols.kSocketLocalAddress],
    localPort: socket[symbols.kSocketLocalPort],
    remoteAddress: socket.remoteAddress,
    remotePort: socket.remotePort,
    attemptedAddresses: socket.autoSelectFamilyAttemptedAddresses,
    connecting: socket.connecting,
  };
}

// make sure error contains socket info
const destroySocket = Socket.prototype.destroy;
Socket.prototype.destroy = function(err?: any) {
  if (err) {
    Object.defineProperty(err, symbols.kErrorSocket, {
      // don't show on console log
      enumerable: false,
      value: this,
    });
  }
  return destroySocket.call(this, err);
};

export function initDiagnosticsChannel() {
  // make sure init global DiagnosticsChannel once
  if (initedDiagnosticsChannel) return;
  initedDiagnosticsChannel = true;

  // This message is published when a new outgoing request is created.
  // Note: a request is only loosely completed to a given socket.
  subscribe('undici:request:create', (message, name) => {
    const { request } = message as DiagnosticsChannel.RequestCreateMessage;
    const store = asyncLocalStorage.getStore();
    if (!store?.requestId) {
      debug('[%s] store not found', name);
      return;
    }
    Reflect.set(request, symbols.kRequestStore, store);
    let queuing = 0;
    if (store.enableRequestTiming) {
      queuing = store.requestTiming.queuing = performanceTime(store.requestStartTime);
    }
    debug('[%s] Request#%d %s %s, path: %s, headers: %o, queuing: %d',
      name, store.requestId, request.method, request.origin, request.path,
      request.headers, queuing);
  });

  subscribe('undici:client:connectError', (message, name) => {
    const { error, connectParams, socket } = message as DiagnosticsChannel.ClientConnectErrorMessage & { error: any, socket: SocketExtend };
    let sock = socket;
    if (!sock && error[symbols.kErrorSocket]) {
      sock = error[symbols.kErrorSocket];
    }
    if (sock) {
      sock[symbols.kSocketId] = globalId('UndiciSocket');
      sock[symbols.kSocketConnectErrorTime] = new Date();
      sock[symbols.kHandledRequests] = 0;
      sock[symbols.kHandledResponses] = 0;
      // copy local address to symbol, avoid them be reset after request error throw
      if (sock.localAddress) {
        sock[symbols.kSocketLocalAddress] = sock.localAddress;
        sock[symbols.kSocketLocalPort] = sock.localPort;
      }
      sock[symbols.kSocketConnectProtocol] = connectParams.protocol;
      sock[symbols.kSocketConnectHost] = connectParams.host;
      sock[symbols.kSocketConnectPort] = connectParams.port;
      debug('[%s] Socket#%d connectError, connectParams: %o, error: %s, (sock: %o)',
        name, sock[symbols.kSocketId], connectParams, (error as Error).message, formatSocket(sock));
    } else {
      debug('[%s] connectError, connectParams: %o, error: %o',
        name, connectParams, error);
    }
  });

  // This message is published after a connection is established.
  subscribe('undici:client:connected', (message, name) => {
    const { socket, connectParams } = message as DiagnosticsChannel.ClientConnectedMessage & { socket: SocketExtend };
    socket[symbols.kSocketId] = globalId('UndiciSocket');
    socket[symbols.kSocketStartTime] = performance.now();
    socket[symbols.kSocketConnectedTime] = new Date();
    socket[symbols.kHandledRequests] = 0;
    socket[symbols.kHandledResponses] = 0;
    // copy local address to symbol, avoid them be reset after request error throw
    socket[symbols.kSocketLocalAddress] = socket.localAddress;
    socket[symbols.kSocketLocalPort] = socket.localPort;
    socket[symbols.kSocketConnectProtocol] = connectParams.protocol;
    socket[symbols.kSocketConnectHost] = connectParams.host;
    socket[symbols.kSocketConnectPort] = connectParams.port;
    debug('[%s] Socket#%d connected (sock: %o)', name, socket[symbols.kSocketId], formatSocket(socket));
  });

  // This message is published right before the first byte of the request is written to the socket.
  subscribe('undici:client:sendHeaders', (message, name) => {
    const { request, socket } = message as DiagnosticsChannel.ClientSendHeadersMessage & { socket: SocketExtend };
    const store = Reflect.get(request, symbols.kRequestStore) as InternalStore;
    if (!store?.requestId) {
      debug('[%s] store not found', name);
      return;
    }

    (socket[symbols.kHandledRequests] as number)++;
    // attach socket to store
    store.requestSocket = socket;
    debug('[%s] Request#%d send headers on Socket#%d (handled %d requests, sock: %o)',
      name, store.requestId, socket[symbols.kSocketId], socket[symbols.kHandledRequests],
      formatSocket(socket));

    if (!store.enableRequestTiming) return;
    store.requestTiming.requestHeadersSent = performanceTime(store.requestStartTime);
    // first socket need to calculate the connected time
    if (socket[symbols.kHandledRequests] === 1) {
      // kSocketStartTime - kRequestStartTime = connected time
      store.requestTiming.connected =
        performanceTime(store.requestStartTime, socket[symbols.kSocketStartTime] as number);
    }
  });

  subscribe('undici:request:bodySent', (message, name) => {
    const { request } = message as DiagnosticsChannel.RequestBodySentMessage;
    const store = Reflect.get(request, symbols.kRequestStore) as InternalStore;
    if (!store?.requestId) {
      debug('[%s] store not found', name);
      return;
    }

    debug('[%s] Request#%d send body', name, store.requestId);
    if (!store.enableRequestTiming) return;
    store.requestTiming.requestSent = performanceTime(store.requestStartTime);
  });

  // This message is published after the response headers have been received, i.e. the response has been completed.
  subscribe('undici:request:headers', (message, name) => {
    const { request, response } = message as DiagnosticsChannel.RequestHeadersMessage;
    const store = Reflect.get(request, symbols.kRequestStore) as InternalStore;
    if (!store?.requestId) {
      debug('[%s] store not found', name);
      return;
    }

    // get socket from opaque
    const socket = store.requestSocket as any;
    if (socket) {
      socket[symbols.kHandledResponses]++;
      debug('[%s] Request#%d get %s response headers(%d bytes) on Socket#%d (handled %d responses, sock: %o)',
        name, store.requestId, response.statusCode, response.headers.length,
        socket[symbols.kSocketId], socket[symbols.kHandledResponses],
        formatSocket(socket));
    } else {
      debug('[%s] Request#%d get %s response headers on Unknown Socket',
        name, store.requestId, response.statusCode);
    }

    if (!store.enableRequestTiming) return;
    store.requestTiming.waiting = performanceTime(store.requestStartTime);
  });

  // This message is published after the response body and trailers have been received, i.e. the response has been completed.
  subscribe('undici:request:trailers', (message, name) => {
    const { request } = message as DiagnosticsChannel.RequestTrailersMessage;
    const store = Reflect.get(request, symbols.kRequestStore) as InternalStore;
    if (!store?.requestId) {
      debug('[%s] store not found', name);
      return;
    }

    debug('[%s] Request#%d get response body and trailers', name, store.requestId);
    if (!store.enableRequestTiming) return;
    store.requestTiming.contentDownload = performanceTime(store.requestStartTime);
  });

  // This message is published if the request is going to error, but it has not errored yet.
  // subscribe('undici:request:error', (message, name) => {
  //   const { request, error } = message as DiagnosticsChannel.RequestErrorMessage;
  //   const opaque = request[kHandler]?.opts?.opaque;
  //   if (!opaque || !opaque[symbols.kRequestId]) return;
  //   const socket = opaque[symbols.kRequestSocket];
  //   debug('[%s] Request#%d error on Socket#%d (handled %d responses, sock: %o), error: %o',
  //     name, opaque[symbols.kRequestId], socket[symbols.kSocketId], socket[symbols.kHandledResponses],
  //     formatSocket(socket), error);
  // });
}
