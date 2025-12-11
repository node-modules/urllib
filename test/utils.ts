import { randomUUID } from 'node:crypto';
import { rm, writeFile } from 'node:fs/promises';
import { tmpdir, platform } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

export async function readableToBytes(stream: Readable | ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let chunk: Buffer;
  for await (chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function readableToString(stream: Readable | ReadableStream): Promise<string> {
  const bytes = await readableToBytes(stream);
  return bytes.toString();
}

export async function createTempfile(
  content?: Buffer | string,
): Promise<{ tmpfile: string; cleanup: () => Promise<void> }> {
  const tmpfile = join(tmpdir(), randomUUID());
  if (typeof content === 'string') {
    content = Buffer.from(content);
  }
  if (Buffer.isBuffer(content)) {
    await writeFile(tmpfile, content);
  }
  return {
    tmpfile,
    async cleanup() {
      await rm(tmpfile, { force: true });
    },
  };
}

export function nodeMajorVersion(): number {
  return parseInt(process.versions.node.split('.')[0]);
}

export function isWindows(): boolean {
  return platform() === 'win32';
}
