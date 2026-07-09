import { downloadJPEG, downloadPNG, downloadSVG, ExportConfig } from '@utils';

export const runFormatExport = async (
  format: string,
  config: ExportConfig,
  name: string,
  onProg: (p: number) => void
) => {
  if (format === 'png') return downloadPNG(config, name, onProg);
  if (format === 'jpeg') return downloadJPEG(config, name, onProg);
  return downloadSVG(config, name, onProg);
};
