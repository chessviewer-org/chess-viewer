import { ExportConfig, getRasterBlob } from '@/shared/utils/canvasExporter';
import { getSVGBlob } from '@/shared/utils/svgExporter';

export const getFormatBlob = (
  format: string,
  config: ExportConfig,
  onProg: (p: number) => void
): Promise<Blob> =>
  format === 'svg'
    ? getSVGBlob(config, onProg)
    : getRasterBlob(config, format === 'png' ? 'png' : 'jpeg', onProg);
