export const FAIRY_ROTATIONS = [90, 180, 270];
export const PIECE_TYPES = ['K', 'Q', 'R', 'B', 'N', 'P'];
export const BASE_COLORS = ['w', 'b'];
export const NEUTRAL_COLOR = 'n';

const SIZE = 100;
const HALF = SIZE / 2;
const PIXELS = 512;

function dataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

function image(svg, clip) {
  const clipAttr = clip ? ` clip-path="url(#${clip})"` : '';
  return `<image width="${SIZE}" height="${SIZE}" href="${dataUri(svg)}"${clipAttr}/>`;
}

function wrap(body, rotation, defs = '') {
  const content = rotation
    ? `<g transform="rotate(${rotation} ${HALF} ${HALF})">${body}</g>`
    : body;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${PIXELS}" height="${PIXELS}">` +
    `${defs}${content}</svg>\n`
  );
}

export function rotatedPiece(svg, rotation) {
  return wrap(image(svg), rotation);
}

export function neutralPiece(whiteSvg, blackSvg, rotation = 0) {
  const defs =
    '<defs>' +
    `<clipPath id="left"><rect width="${HALF}" height="${SIZE}"/></clipPath>` +
    `<clipPath id="right"><rect x="${HALF}" width="${HALF}" height="${SIZE}"/></clipPath>` +
    '</defs>';
  return wrap(
    image(whiteSvg, 'left') + image(blackSvg, 'right'),
    rotation,
    defs
  );
}

export function fairyFileName(color, type, rotation = 0) {
  return `${color}${type}${rotation ? rotation : ''}.svg`;
}

export function fairyPiecesForSet(readBase) {
  const files = new Map();
  for (const type of PIECE_TYPES) {
    const white = readBase(`w${type}.svg`);
    const black = readBase(`b${type}.svg`);
    for (const rotation of FAIRY_ROTATIONS) {
      files.set(
        fairyFileName('w', type, rotation),
        rotatedPiece(white, rotation)
      );
      files.set(
        fairyFileName('b', type, rotation),
        rotatedPiece(black, rotation)
      );
    }
    for (const rotation of [0, ...FAIRY_ROTATIONS]) {
      files.set(
        fairyFileName(NEUTRAL_COLOR, type, rotation),
        neutralPiece(white, black, rotation)
      );
    }
  }
  return files;
}
