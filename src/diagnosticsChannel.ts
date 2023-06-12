import diagnosticsChannel from 'node:diagnostics_channel';
import { performance } from 'node:perf_hooks';
import { debuglog } from 'node:util';
import { Socket } from 'node:net';
import { DiagnosticsChannel } from 'undici';
import symbols from './symbols';
import { globalId, performanceTime } from './utils';

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
  if (typeof diagnosticsChannel.subscribe === 'function') {
    diagnosticsChannel.subscribe(name, listener);
  } else {
    // TODO: support Node.js 14, will be removed on the next major version
    diagnosticsChannel.channel(name).subscribe(listener);
  }
}

function formatSocket(socket: Socket) {
  if (!socket) return socket;
  return {
    localAddress: socket[symbols.kSocketLocalAddress],
    localPort: socket[symbols.kSocketLocalPort],
    remoteAddress: socket.remoteAddress,
    remotePort: socket.remotePort,
  };
}

export function initDiagnosticsChannel() {
  // makre sure init global DiagnosticsChannel once
  if (initedDiagnosticsChannel) return;
  initedDiagnosticsChannel = true;

  let kHandler: symbol;
  // This message is published when a new outgoing request is created.
  // Note: a request is only loosely completed to a given socket.
  subscribe('undici:request:create', (message, name) => {
    const { request } = message as DiagnosticsChannel.RequestCreateMessage;
    if (!kHandler) {
      const symbols = Object.getOwnPropertySymbols(request);
      for (const symbol of symbols) {
        if (symbol.description === 'handler') {
          kHandler = symbol;
          break;
        }
      }
    }
    const opaque = request[kHandler]?.opts?.opaque;
    // ignore non HttpClient Request
    if (!opaque || !opaque[symbols.kRequestId]) return;
    debug('[%s] Request#%d %s %s, path: %s, headers: %o',
      name, opaque[symbols.kRequestId], request.method, request.origin, request.path, request.headers);
    if (!opaque[symbols.kEnableRequestTiming]) return;
    opaque[symbols.kRequestTiming].queuing = performanceTime(opaque[symbols.kRequestStartTime]);
  });

  // diagnosticsChannel.channel('undici:client:beforeConnect')
  // diagnosticsChannel.channel('undici:client:connectError')
  // This message is published after a connection is established.
  subscribe('undici:client:connected', (message, name) => {
    const { socket } = message as DiagnosticsChannel.ClientConnectedMessage;
    socket[symbols.kSocketId] = globalId('UndiciSocket');
    socket[symbols.kSocketStartTime] = performance.now();
    socket[symbols.kSocketConnectedTime] = new Date();
    socket[symbols.kHandledRequests] = 0;
    socket[symbols.kHandledResponses] = 0;
    // copy local address to symbol, avoid them be reset after request error throw
    socket[symbols.kSocketLocalAddress] = socket.localAddress;
    socket[symbols.kSocketLocalPort] = socket.localPort;
    debug('[%s] Socket#%d connected (sock: %o)', name, socket[symbols.kSocketId], formatSocket(socket));
  });

  // This message is published right before the first byte of the request is written to the socket.
  subscribe('undici:client:sendHeaders', (message, name) => {
    const { request, socket } = message as DiagnosticsChannel.ClientSendHeadersMessage;
    if (!kHandler) return;
    const opaque = request[kHandler]?.opts?.opaque;
    if (!opaque || !opaque[symbols.kRequestId]) return;

    socket[symbols.kHandledRequests]++;
    // attach socket to opaque
    opaque[symbols.kRequestSocket] = socket;
    debug('[%s] Request#%d send headers on Socket#%d (handled %d requests, sock: %o)',
      name, opaque[symbols.kRequestId], socket[symbols.kSocketId], socket[symbols.kHandledRequests],
      formatSocket(socket));

    if (!opaque[symbols.kEnableRequestTiming]) return;
    opaque[symbols.kRequestTiming].requestHeadersSent = performanceTime(opaque[symbols.kRequestStartTime]);
    // first socket need to caculate the connected time
    if (socket[symbols.kHandledRequests] === 1) {
      // kSocketStartTime - kRequestStartTime = connected time
      opaque[symbols.kRequestTiming].connected =
        performanceTime(opaque[symbols.kRequestStartTime], socket[symbols.kSocketStartTime]);
    }
  });

  subscribe('undici:request:bodySent', (message, name) => {
    const { request } = message as DiagnosticsChannel.RequestBodySentMessage;
    if (!kHandler) return;
    const opaque = request[kHandler]?.opts?.opaque;
    if (!opaque || !opaque[symbols.kRequestId]) return;

    debug('[%s] Request#%d send body', name, opaque[symbols.kRequestId]);
    if (!opaque[symbols.kEnableRequestTiming]) return;
    opaque[symbols.kRequestTiming].requestSent = performanceTime(opaque[symbols.kRequestStartTime]);
  });

  // This message is published after the response headers have been received, i.e. the response has been completed.
  subscribe('undici:request:headers', (message, name) => {
    const { request, response } = message as DiagnosticsChannel.RequestHeadersMessage;
    if (!kHandler) return;
    const opaque = request[kHandler]?.opts?.opaque;
    if (!opaque || !opaque[symbols.kRequestId]) return;

    // get socket from opaque
    const socket = opaque[symbols.kRequestSocket];
    socket[symbols.kHandledResponses]++;
    debug('[%s] Request#%d get %s response headers on Socket#%d (handled %d responses, sock: %o)',
      name, opaque[symbols.kRequestId], response.statusCode, socket[symbols.kSocketId], socket[symbols.kHandledResponses],
      formatSocket(socket));

    if (!opaque[symbols.kEnableRequestTiming]) return;
    opaque[symbols.kRequestTiming].waiting = performanceTime(opaque[symbols.kRequestStartTime]);
  });

  // This message is published after the response body and trailers have been received, i.e. the response has been completed.
  subscribe('undici:request:trailers', (message, name) => {
    const { request } = message as DiagnosticsChannel.RequestTrailersMessage;
    if (!kHandler) return;
    const opaque = request[kHandler]?.opts?.opaque;
    if (!opaque || !opaque[symbols.kRequestId]) return;

    debug('[%s] Request#%d get response body and trailers', name, opaque[symbols.kRequestId]);

    if (!opaque[symbols.kEnableRequestTiming]) return;
    opaque[symbols.kRequestTiming].contentDownload = performanceTime(opaque[symbols.kRequestStartTime]);
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
