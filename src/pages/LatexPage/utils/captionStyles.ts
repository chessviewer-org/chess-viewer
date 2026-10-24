import { type LatexCaptionStyle } from '@chessviewer-org/chess-viewer';

export const CAPTION_STYLE_OPTIONS: ReadonlyArray<{
  value: LatexCaptionStyle;
  label: string;
  hint: string;
}> = [
  {
    value: 'problem',
    label: 'Problem',
    hint: 'Number and credits above; (white+black) bottom-left, stipulation bottom-right.'
  },
  {
    value: 'study',
    label: 'Study',
    hint: 'Number and credits above; stipulation and piece count centred below.'
  },
  {
    value: 'game',
    label: 'Game',
    hint: 'Players, event and date above; caption and side to move below.'
  },
  {
    value: 'plain',
    label: 'Plain',
    hint: 'Only the number above and the stipulation below.'
  },
  {
    value: 'classic',
    label: 'Classic',
    hint: 'Everything stacked under the board.'
  }
];
