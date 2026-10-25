#!/usr/bin/env bash
set -euo pipefail

# Run after activating Emscripten 6.0.13. Supply a clean upstream checkout.
source_dir="${1:?Usage: native/popeye/build.sh /path/to/popeye}"
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
upstream_commit=8bf65b054482cae04fc36e07c6b880fb4f93c673

test "$(git -C "$source_dir" rev-parse HEAD)" = "$upstream_commit"
git -C "$source_dir" diff --exit-code --quiet -- . ':!pygmarr.c'
emcc --version | head -n 1 | grep -F '6.0.13'
find "$source_dir" -type f \( -name '*.o' -o -name '*.a' \) -delete

git -C "$source_dir" apply "$project_dir/native/popeye/patches/position-preview.patch" "$project_dir/native/popeye/patches/history-context.patch"
cp "$project_dir/native/popeye/position-preview.h" "$source_dir/output/plaintext/chessviewer_preview.h"
cleanup() {
  git -C "$source_dir" apply --reverse "$project_dir/native/popeye/patches/position-preview.patch" "$project_dir/native/popeye/patches/history-context.patch"
  rm -f "$source_dir/output/plaintext/chessviewer_preview.h"
}
trap cleanup EXIT

# Popeye's board-table generator runs on the build host. The upstream
# makefiles share linker flags between host and target, so build it first.
gcc -O3 -I"$source_dir" -DAUXILIARY -c "$source_dir/gengmarr.c" -o "$source_dir/gengmarr.o"
gcc -O3 -I"$source_dir" -DAUXILIARY -c "$source_dir/position/position.c" -o "$source_dir/position/position-host.o"
gcc -O3 -I"$source_dir" -DAUXILIARY -c "$source_dir/position/board.c" -o "$source_dir/position/board-host.o"
gcc -o "$source_dir/gengmarr.mjs" "$source_dir/gengmarr.o" "$source_dir/position/position-host.o" "$source_dir/position/board-host.o"

make -C "$source_dir" -f makefile.unx -j4 \
  CCTARGET=emcc LDTARGET=emcc ARCHIVER='emar rv' ARCHIVE_INDEXER=emranlib \
  STRIPTARGET=true EXE_SUFFIX=.mjs DEPEND= \
  'CFLAGS=-O3 -DNDEBUG -DSIGNALS -DMSG_IN_MEM -DFXF -DFXF_MAX_ALIGNMENT_TYPE=void* -DFXF_NOT_MULTIPLE_ALIGNMENT_TYPE=short -I. -DOSTYPE=\"WASM\" -DVERSION=4.103' \
  'LDFLAGS=-O3 -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=worker,node -sEXPORTED_RUNTIME_METHODS=FS,callMain -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=33554432 -sMAXIMUM_MEMORY=268435456 -sSTACK_SIZE=8388608 -sDYNAMIC_EXECUTION=0 -sEXIT_RUNTIME=0'

runtime="$project_dir/public/wasm/popeye"
licenses="$project_dir/public/licenses/popeye"
mkdir -p "$runtime" "$licenses"
cp "$source_dir/py.mjs" "$source_dir/py.wasm" "$runtime/"
cp "$source_dir/py-engl.txt" "$licenses/py-engl.txt"
cp "$(em-config EMSCRIPTEN_ROOT)/LICENSE" "$licenses/EMSCRIPTEN-LICENSE.txt"
