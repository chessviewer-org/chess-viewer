/**
 * Changes the resolution (DPI) of a PNG or JPEG blob.
 *
 * @param blob - The image blob to modify
 * @param dpi - The target DPI value
 * @param format - The image format ('png' or 'jpeg')
 * @returns Promise resolving to a new Blob with modified DPI
 */
export async function changeDPI(
  blob: Blob,
  dpi: number,
  format: 'png' | 'jpeg'
): Promise<Blob> {
  if (format === 'png') {
    return changePngDPI(blob, dpi);
  }
  return changeJpegDPI(blob, dpi);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

/**
 * Changes DPI for PNG using the pHYs chunk.
 *
 * @param blob - PNG blob
 * @param dpi - Target DPI
 * @returns Promise resolving to modified PNG blob
 */
async function changePngDPI(blob: Blob, dpi: number): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const pixelsPerMeter = Math.round(dpi * 39.3701);
  const pHYsChunk = new Uint8Array(21);

  pHYsChunk.set([0, 0, 0, 9, 112, 72, 89, 115]);

  const view = new DataView(pHYsChunk.buffer);
  view.setUint32(8, pixelsPerMeter);
  view.setUint32(12, pixelsPerMeter);
  pHYsChunk[16] = 1;

  let crc = 0xffffffff;
  for (let i = 4; i < 17; i++) {
    const byte = pHYsChunk[i];
    if (byte !== undefined) {
      crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
    }
  }
  view.setUint32(17, crc ^ 0xffffffff);

  const chunks: Uint8Array[] = [];
  chunks.push(bytes.slice(0, 8));

  let pos = 8;
  let inserted = false;

  while (pos < bytes.length) {
    const length = new DataView(bytes.buffer).getUint32(pos);
    const type = String.fromCharCode(...bytes.slice(pos + 4, pos + 8));

    if (!inserted && (type === 'IDAT' || type === 'PLTE')) {
      chunks.push(pHYsChunk);
      inserted = true;
    }

    if (type !== 'pHYs') {
      chunks.push(bytes.slice(pos, pos + 12 + length));
    }

    pos += 12 + length;
  }

  if (!inserted) {
    chunks.splice(chunks.length - 1, 0, pHYsChunk);
  }

  return new Blob(chunks as BlobPart[], { type: 'image/png' });
}

/**
 * Changes DPI for JPEG using the JFIF header.
 *
 * @param blob - JPEG blob
 * @param dpi - Target DPI
 * @returns Promise resolving to modified JPEG blob
 */
async function changeJpegDPI(blob: Blob, dpi: number): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return blob;

  let pos = 2;
  while (pos < bytes.length) {
    if (bytes[pos] !== 0xff) break;

    const marker = bytes[pos + 1];
    const lengthByte1 = bytes[pos + 2];
    const lengthByte2 = bytes[pos + 3];

    if (lengthByte1 === undefined || lengthByte2 === undefined) break;

    const length = (lengthByte1 << 8) + lengthByte2;

    if (marker === 0xe0 && length >= 16) {
      const jfif = bytes.slice(pos, pos + 2 + length);
      jfif[13] = 1;
      jfif[14] = (dpi >> 8) & 0xff;
      jfif[15] = dpi & 0xff;
      jfif[16] = (dpi >> 8) & 0xff;
      jfif[17] = dpi & 0xff;

      const newBytes = new Uint8Array(bytes.length);
      newBytes.set(bytes.slice(0, pos));
      newBytes.set(jfif, pos);
      newBytes.set(bytes.slice(pos + 2 + length), pos + 2 + length);
      return new Blob([newBytes], { type: 'image/jpeg' });
    }

    if (marker === 0xda) break;
    pos += 2 + length;
  }

  const jfifHeader = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
    (dpi >> 8) & 0xff, dpi & 0xff, (dpi >> 8) & 0xff, dpi & 0xff, 0x00, 0x00
  ]);

  const finalBytes = new Uint8Array(bytes.length + jfifHeader.length);
  finalBytes.set(bytes.slice(0, 2));
  finalBytes.set(jfifHeader, 2);
  finalBytes.set(bytes.slice(2), 2 + jfifHeader.length);
  return new Blob([finalBytes], { type: 'image/jpeg' });
}
