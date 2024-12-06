import { Transform } from 'node:stream';

const BUF_SIZE = 1024 * 1024;

export class BufferStream extends Transform {
  private buf: Buffer;
  private offset: number;

  constructor(options?: any) {
    super(options);
    this.realloc();
  }

  realloc() {
    this.buf = Buffer.alloc(BUF_SIZE);
    this.offset = 0;
  }

  _transform(chunk: Buffer, _: any, callback: any) {
    const currentLength = this.offset;
    const chunkSize = chunk.length;
    const newSize = currentLength + chunkSize;
    // 缓冲区未满
    // - 向缓冲区写入
    if (newSize < BUF_SIZE) {
      chunk.copy(this.buf, currentLength);
      this.offset += chunkSize;
      return callback();
    }

    // 缓冲区正好满
    // - 拷贝到缓冲区以后, 将 chunk 返回
    // - 刷新缓冲区
    if (newSize === BUF_SIZE) {
      chunk.copy(this.buf, currentLength);
      const writeChunk = this.buf;
      this.realloc();
      return callback(null, writeChunk);
    }

    // 超过缓冲区大小
    // - 拷贝到缓冲区以后, 将 chunk 返回
    // - 刷新缓冲区
    // - 将超出的部分拷贝到新的缓冲区中
    const copyLength = BUF_SIZE - currentLength;
    const remainLength = chunkSize - copyLength;
    chunk.copy(this.buf, currentLength, 0, copyLength);
    const writeChunk = this.buf;
    this.push(writeChunk);
    this.realloc();

    if (remainLength > BUF_SIZE) {
      // 特殊情况: 给了一个超大 chunk
      // 直接将这个 chunk 返回，没必要缓冲了
      this.push(chunk.slice(copyLength));
    } else {
      chunk.copy(this.buf, 0, copyLength);
      this.offset = remainLength;
    }
    return callback(null);
  }

  _flush(callback: any) {
    if (this.offset) {
      const chunk = Buffer.alloc(this.offset);
      this.buf.copy(chunk);
      this.push(chunk);
      this.offset = 0;
    }
    callback();
  }
}
