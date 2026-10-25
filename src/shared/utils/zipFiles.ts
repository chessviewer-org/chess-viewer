import { type Zippable, zip } from 'fflate';

export interface ZipEntry {
  path: string;
  blob: Blob;
}

export async function zipFiles(entries: readonly ZipEntry[]): Promise<Blob> {
  const data: Zippable = {};
  for (const { path, blob } of entries) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    data[path] = blob.type.startsWith('image/svg')
      ? bytes
      : [bytes, { level: 0 }];
  }
  return new Promise((resolve, reject) => {
    zip(data, (error, out) => {
      if (error) reject(error);
      else resolve(new Blob([out], { type: 'application/zip' }));
    });
  });
}
