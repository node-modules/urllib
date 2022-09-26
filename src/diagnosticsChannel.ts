import diagnosticsChannel from 'diagnostics_channel';
import { performance } from 'perf_hooks';
import { debuglog } from 'util';
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
export function initDiagnosticsChannel() {
  // makre sure init global DiagnosticsChannel once
  if (initedDiagnosticsChannel) return;
  initedDiagnosticsChannel = true;

  let kHandler: any;
  // This message is published when a new outgoing request is created.
  // Note: a request is only loosely completed to a given socket.
  diagnosticsChannel.channel('undici:request:create').subscribe((message, name) => {
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
    debug('[%s] Request#%d %s %s, path: %s', name, opaque[symbols.kRequestId], request.method, request.origin, request.path);
    if (!opaque[symbols.kEnableRequestTiming]) return;
    opaque[symbols.kRequestTiming].queuing = performanceTime(opaque[symbols.kRequestStartTime]);
  });

  // diagnosticsChannel.channel('undici:client:beforeConnect')
  // diagnosticsChannel.channel('undici:client:connectError')
  // This message is published after a connection is established.
  diagnosticsChannel.channel('undici:client:connected').subscribe((message, name) => {
    const { socket } = message as DiagnosticsChannel.ClientConnectedMessage;
    socket[symbols.kSocketId] = globalId('UndiciSocket');
    socket[symbols.kSocketStartTime] = performance.now();
    socket[symbols.kHandledRequests] = 0;
    socket[symbols.kHandledResponses] = 0;
    debug('[%s] Socket#%d connected', name, socket[symbols.kSocketId]);
  });

  // This message is published right before the first byte of the request is written to the socket.
  diagnosticsChannel.channel('undici:client:sendHeaders').subscribe((message, name) => {
    const { request, socket } = message as DiagnosticsChannel.ClientSendHeadersMessage;
    if (!kHandler) return;
    const opaque = request[kHandler]?.opts?.opaque;
    if (!opaque || !opaque[symbols.kRequestId]) return;

    socket[symbols.kHandledRequests]++;
    // attach socket to opaque
    opaque[symbols.kRequestSocket] = socket;
    debug('[%s] Request#%d send headers on Socket#%d (handled %d requests)',
      name, opaque[symbols.kRequestId], socket[symbols.kSocketId], socket[symbols.kHandledRequests]);

    if (!opaque[symbols.kEnableRequestTiming]) return;
    opaque[symbols.kRequestTiming].requestHeadersSent = performanceTime(opaque[symbols.kRequestStartTime]);
    // first socket need to caculate the connected time
    if (socket[symbols.kHandledRequests] === 1) {
      // kSocketStartTime - kRequestStartTime = connected time
      opaque[symbols.kRequestTiming].connected =
        performanceTime(opaque[symbols.kRequestStartTime], socket[symbols.kSocketStartTime]);
    }
  });

  diagnosticsChannel.channel('undici:request:bodySent').subscribe((message, name) => {
    const { request } = message as DiagnosticsChannel.RequestBodySentMessage;
    if (!kHandler) return;
    const opaque = request[kHandler]?.opts?.opaque;
    if (!opaque || !opaque[symbols.kRequestId]) return;

    debug('[%s] Request#%d send body', name, opaque[symbols.kRequestId]);
    if (!opaque[symbols.kEnableRequestTiming]) return;
    opaque[symbols.kRequestTiming].requestSent = performanceTime(opaque[symbols.kRequestStartTime]);
  });

  // This message is published after the response headers have been received, i.e. the response has been completed.
  diagnosticsChannel.channel('undici:request:headers').subscribe((message, name) => {
    const { request, response } = message as DiagnosticsChannel.RequestHeadersMessage;
    if (!kHandler) return;
    const opaque = request[kHandler]?.opts?.opaque;
    if (!opaque || !opaque[symbols.kRequestId]) return;

    // get socket from opaque
    const socket = opaque[symbols.kRequestSocket];
    socket[symbols.kHandledResponses]++;
    debug('[%s] Request#%d get %s response headers on Socket#%d (handled %d responses)',
      name, opaque[symbols.kRequestId], response.statusCode, socket[symbols.kSocketId], socket[symbols.kHandledResponses]);

    if (!opaque[symbols.kEnableRequestTiming]) return;
    opaque[symbols.kRequestTiming].waiting = performanceTime(opaque[symbols.kRequestStartTime]);
  });

  // This message is published after the response body and trailers have been received, i.e. the response has been completed.
  diagnosticsChannel.channel('undici:request:trailers').subscribe((message, name) => {
    const { request } = message as DiagnosticsChannel.RequestTrailersMessage;
    if (!kHandler) return;
    const opaque = request[kHandler]?.opts?.opaque;
    if (!opaque || !opaque[symbols.kRequestId]) return;

    debug('[%s] Request#%d get response body and trailers', name, opaque[symbols.kRequestId]);

    if (!opaque[symbols.kEnableRequestTiming]) return;
    opaque[symbols.kRequestTiming].contentDownload = performanceTime(opaque[symbols.kRequestStartTime]);
  });
  // diagnosticsChannel.channel('undici:request:error')
}
