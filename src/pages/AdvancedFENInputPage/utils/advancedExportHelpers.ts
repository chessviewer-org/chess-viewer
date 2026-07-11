import { downloadJPEG, downloadPNG, downloadSVG, ExportConfig } from '@utils';

export const runFormatExport = async (
  format: string,
  config: ExportConfig,
  name: string,
  onProg: (p: number) => void
): Promise<void> => {
  if (format === 'png') await downloadPNG(config, name, onProg);
  else if (format === 'jpeg') await downloadJPEG(config, name, onProg);
  else await downloadSVG(config, name, onProg);
};
