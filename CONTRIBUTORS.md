# Contributors

Thank you to everyone who has helped improve ChessVision. This file recognizes the people who have contributed code, fixes, and improvements to the project.

---

## Core Team

### Khatai Huseynzada — [@BilgeGates](https://github.com/BilgeGates)

**Project author and maintainer.**

---

## Contributors

### [@vektorhub](https://github.com/vektorhub)

<img src="https://github.com/vektorhub.png" width="64" height="64" alt="vektorhub avatar" style="border-radius:50%"/>

**Last contribution:** May 2026

#### Unnecessary background canvas render removed

A hidden canvas render pipeline that ran continuously in the background — separate from the export process — was identified and removed. The board now renders only where needed, reducing idle CPU usage.

#### Navigation performance improved

A repetitive draw cycle on the main page that increased render load during navigation and settings changes was simplified, resulting in smoother in-app transitions.

#### 32× export board size calculation fixed

A scaling miscalculation in the 24× and 32× export modes caused the output dimensions to deviate from the specified board size in centimetres. The formula was corrected so that, for example, a 4 cm board at 32× quality now produces output based on that exact measurement.

#### Export size calculation unified

The logic for computing export dimensions was consolidated into a single source. Previously, the dimension displayed in the UI could differ from the dimension used to generate the canvas. This inconsistency has been resolved.

#### Piece drag offset corrected

The drag preview for pieces was misaligned from the cursor during drag operations. The preview now tracks the cursor accurately throughout the drag interaction.

#### Asset caching improved — [#53](https://github.com/chessvision-org/chess-vision/pull/53)

Repeated loading of identical piece images across pages was reduced. This lightens the load during page transitions and general use.

#### Export progress indicator fixed

The progress bar shown during export now reflects actual processing steps rather than advancing at an arbitrary rate.

#### Export pipeline cleaned up

PNG, JPEG, and SVG export flows were refactored for consistency and reliability.

#### Batch export ordering fixed

In multi-position export, each position is now downloaded sequentially with an incrementing numeric filename.

#### Large export size information added

For 24× and 32× quality options, the interface now displays the expected output dimensions so users can anticipate file size before exporting.

#### Large export warning added

A warning is shown when an export configuration may place significant demand on the device, allowing users to make an informed choice before proceeding.

#### FEN error messages improved

Validation errors now indicate the specific part of the FEN string that failed, rather than returning a generic invalid message.

#### Data management added to settings

Users can now export their saved data, restore it from a backup, or reset it entirely from within the settings panel.

#### FEN validation unit tests added

Basic automated tests were introduced for core FEN validation logic to help catch regressions.

#### Performance documentation updated

Internal documentation was updated to reflect the optimisations made and to note considerations for large export operations.

---

### [@yu102118](https://github.com/yu102118)

<img src="https://github.com/yu102118.png" width="64" height="64" alt="yu102118 avatar" style="border-radius:50%"/>

**Last contribution:** May 2026

#### localStorage data loss resolved

An issue causing saved user data — including FEN history, favourites, and settings — to be unexpectedly cleared from localStorage was identified and fixed.

#### FEN input security limit introduced

A maximum length constraint was added to the FEN input field to prevent excessively long strings from being submitted, protecting against potential parsing issues and UI instability.

---

_To contribute to ChessVision, please read [CONTRIBUTING.md](CONTRIBUTING.md) and open a pull request._
