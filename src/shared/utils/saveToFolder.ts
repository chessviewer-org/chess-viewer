export interface ExportFile {
  name: string;
  extension: string;
  blob: Blob;
}

type DirectoryPicker = (options: {
  id: string;
  mode: 'readwrite';
}) => Promise<FileSystemDirectoryHandle>;

export async function chooseFolderLocation(): Promise<
  FileSystemDirectoryHandle | undefined
> {
  const picker = (window as Window & { showDirectoryPicker?: DirectoryPicker })
    .showDirectoryPicker;
  if (!picker) return undefined;
  try {
    return await picker({ id: 'chessviewer-export', mode: 'readwrite' });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw new Error('Export cancelled', { cause: error });
    throw error;
  }
}

export async function writeFolder(
  location: FileSystemDirectoryHandle,
  folder: string,
  files: readonly ExportFile[]
): Promise<void> {
  const directory = await location.getDirectoryHandle(folder, {
    create: true
  });
  for (const { name, extension, blob } of files) {
    const handle = await directory.getFileHandle(`${name}.${extension}`, {
      create: true
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  }
}
