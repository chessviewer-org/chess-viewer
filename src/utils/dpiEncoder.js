/**
 * Encodes physical DPI metadata into PNG and JPEG blobs.
 */

const PNG_SIGNATURE = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
]);
const MAX_JPEG_DENSITY = 65535;

/**
 * Changes the DPI metadata of a PNG or JPEG blob.
 *
 * @param {Blob} blob
 * @param {number} dpi
 * @param {'png'|'jpeg'|'jpg'} format
 * @returns {Promise<Blob>}
 */
export async function changeDPI(blob, dpi, format) {
  const normalizedDpi = normalizeDpi(dpi);
  if (!normalizedDpi) return blob;

  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (format === 'png') {
    return new Blob([rewritePngDpi(bytes, normalizedDpi)], {
      type: 'image/png'
    });
  }

  if (format === 'jpeg' || format === 'jpg') {
    return new Blob([rewriteJpegDpi(bytes, normalizedDpi)], {
      type: 'image/jpeg'
    });
  }

  return blob;
}

function normalizeDpi(dpi) {
  if (!Number.isFinite(dpi) || dpi <= 0) return 0;
  return Math.max(1, Math.round(dpi));
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function readUint32BE(bytes, offset) {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

function writeUint32BE(bytes, offset, value) {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

function writeUint16BE(bytes, offset, value) {
  bytes[offset] = (value >>> 8) & 0xff;
  bytes[offset + 1] = value & 0xff;
}

function sliceType(bytes, offset) {
  return String.fromCharCode(
    bytes[offset + 4],
    bytes[offset + 5],
    bytes[offset + 6],
    bytes[offset + 7]
  );
}

function spliceBytes(source, start, deleteCount, insert) {
  const before = source.subarray(0, start);
  const after = source.subarray(start + deleteCount);
  const result = new Uint8Array(before.length + insert.length + after.length);
  result.set(before, 0);
  result.set(insert, before.length);
  result.set(after, before.length + insert.length);
  return result;
}

function makePngPhysChunk(dpi) {
  const ppm = Math.max(1, Math.round(dpi / 0.0254));
  const chunk = new Uint8Array(21);

  writeUint32BE(chunk, 0, 9);
  // pHYs
  chunk[4] = 0x70;
  chunk[5] = 0x48;
  chunk[6] = 0x59;
  chunk[7] = 0x73;
  writeUint32BE(chunk, 8, ppm);
  writeUint32BE(chunk, 12, ppm);
  chunk[16] = 1;
  writeUint32BE(chunk, 17, crc32(chunk.subarray(4, 17)));

  return chunk;
}

function rewritePngDpi(bytes, dpi) {
  if (bytes.length < 33 || !arraysEqual(bytes.subarray(0, 8), PNG_SIGNATURE)) {
    return bytes;
  }

  const physChunk = makePngPhysChunk(dpi);
  let offset = 8;
  let physStart = -1;
  let physTotalLength = 0;
  let insertBefore = -1;

  while (offset + 8 <= bytes.length) {
    const chunkLength = readUint32BE(bytes, offset);
    const totalLength = chunkLength + 12;
    if (offset + totalLength > bytes.length) {
      return bytes;
    }

    const type = sliceType(bytes, offset);
    if (type === 'pHYs') {
      physStart = offset;
      physTotalLength = totalLength;
      break;
    }
    if (insertBefore === -1 && (type === 'IDAT' || type === 'IEND')) {
      insertBefore = offset;
      if (type === 'IEND') break;
    }

    offset += totalLength;
  }

  if (physStart !== -1) {
    return spliceBytes(bytes, physStart, physTotalLength, physChunk);
  }

  if (insertBefore !== -1) {
    return spliceBytes(bytes, insertBefore, 0, physChunk);
  }

  return bytes;
}

function readUint16BE(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function makeJfifSegment(dpi) {
  const clamped = Math.min(MAX_JPEG_DENSITY, dpi);
  const segment = new Uint8Array(18);
  segment.set(
    [
      0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ],
    0
  );
  writeUint16BE(segment, 12, clamped);
  writeUint16BE(segment, 14, clamped);
  return segment;
}

function rewriteJpegDpi(bytes, dpi) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return bytes;
  }

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }

    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset++;
    }
    if (offset >= bytes.length) break;

    const marker = bytes[offset];
    const markerOffset = offset - 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }

    if (markerOffset + 4 > bytes.length) break;
    const length = readUint16BE(bytes, markerOffset + 2);
    if (length < 2 || markerOffset + 2 + length > bytes.length) {
      break;
    }

    if (
      marker === 0xe0 &&
      length >= 16 &&
      bytes[markerOffset + 4] === 0x4a &&
      bytes[markerOffset + 5] === 0x46 &&
      bytes[markerOffset + 6] === 0x49 &&
      bytes[markerOffset + 7] === 0x46 &&
      bytes[markerOffset + 8] === 0x00
    ) {
      const result = bytes.slice();
      const clamped = Math.min(MAX_JPEG_DENSITY, dpi);
      result[markerOffset + 11] = 1;
      writeUint16BE(result, markerOffset + 12, clamped);
      writeUint16BE(result, markerOffset + 14, clamped);
      return result;
    }

    offset = markerOffset + 2 + length;
  }

  const jfif = makeJfifSegment(dpi);
  return spliceBytes(bytes, 2, 0, jfif);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}
