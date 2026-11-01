# Kaetram local visual pack

This directory contains the visual assets copied from [Kaetram-Open](https://github.com/Kaetram/Kaetram-Open) at commit `f5b6665ef035ba79816458b92cbe77204042a318`.

- Sprite files: **1316** PNGs (2,257,013 bytes).
- Runtime catalog: [`src/odyssey/kaetram-sprites.json`](../../src/odyssey/kaetram-sprites.json).
- Source catalog preserved as [`catalog.source.json`](catalog.source.json).
- Attribution and license terms: [`LICENSE`](LICENSE) and [`LICENSE_OPL`](LICENSE_OPL).

The game uses `/kaetram/img/...` URLs, so the imported sprites remain inside the game build and do not depend on Kaetram's original asset host. The existing procedural art remains as a fallback for Creature Clash enemies and characters that do not have a matching Kaetram sheet.
