# Third-party notices

ChessViewer application code is licensed under the root AGPL-3.0 license.
Bundled material retains its own terms:

| Material                                   | Terms and corresponding source                                                                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Popeye 4.103 WebAssembly engine            | [Upstream terms and build notice](popeye/NOTICE.txt), [complete upstream source](popeye/popeye-4.103-source.tar.gz), [ChessViewer patches and build recipe](popeye/popeye-4.103-build-inputs.tar.gz) |
| Stockfish.js 18 and 19 WebAssembly engines | [Versioned source notice](stockfish/NOTICE.txt), [GPL-3.0 text](stockfish/Copying.txt)                                                                                                               |
| Chess-art piece sets                       | [MIT license](chess-art/LICENSE.txt), [upstream](https://github.com/maurimo/chess-art)                                                                                                               |
| Other chess piece sets                     | [Author and license by set](../piece/ATTRIBUTION.md), with local [GPL-2.0](piece/GPL-2.0.txt), [CC BY 4.0](piece/CC-BY-4.0.txt) and [CC BY-NC-SA 4.0](piece/CC-BY-NC-SA-4.0.txt) texts               |
| Inter font                                 | [SIL Open Font License 1.1](inter/LICENSE.txt), [upstream](https://github.com/rsms/inter)                                                                                                            |
| Lucide icon paths                          | [Lucide ISC and Feather MIT notices](lucide/LICENSE.txt), [upstream](https://github.com/lucide-icons/lucide)                                                                                         |
| Browser runtime packages                   | [Individual package notices](dependencies/README.md)                                                                                                                                                 |

The [attribution index](../piece/ATTRIBUTION.md) gives the original author,
source and terms for all 20 piece sets, including the two described upstream
as “freeware” without a standard license text. Generated fairy pieces retain
the terms of their source artwork.

Development tools listed under `devDependencies` in `package.json` are not
included in the browser bundle. Their own notices remain in the installed
packages and upstream repositories.
