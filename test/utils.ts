import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';

export async function readableToBytes(stream: Readable | ReadableStream) {
  const chunks: Buffer[] = [];
  let chunk: Buffer;
  for await (chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
