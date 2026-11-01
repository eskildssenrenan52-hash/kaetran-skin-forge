<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Game architecture
- Preserve the imported browser Canvas RPG engine and original catalog; settlement mechanics live in a separate module so combat and quests remain compatible.
- Keep the original browser save key with backward-compatible settlement and terrain fields.
- Use deterministic world generation for the expanded biome network so saved terrain coordinates remain stable.
- Match the source game's indexed-access compiler behavior while keeping strict typing enabled; its fixed sprite palettes and tile arrays assume indexed values exist.
- Render world objects through the browser-only WorldArt module from bundled 8-sprite sheets (128px cells, bottom-aligned) in src/assets/art; tiles drawn as sprites get their biome ground underneath.
- Keep legacy generation and treasure coordinates in the original region; generate frontier terrain in lightweight sectors from a separate browser-safe catalog so larger worlds retain save compatibility and fast startup.
- Size the Canvas camera from its screen bounds and keep controls as accessible overlays; this fills different screen proportions without stretching pixel-art geometry.
- Generate frontier enemies near exploration rather than allocating a world-wide population; this preserves original quest enemies and bounds combat workload.
- Odyssey lives in src/odyssey at /odyssey; / is its title and accounts. Mana Echoes is no longer included.
- Accounts only store a player profile (username); game progress stays in browser storage, as the user chose.
- Hidden realms reuse the temple depth state with `realm_`-prefixed pseudo-temples so the engine needs no new depth kind.
- UI chrome uses AI-generated pixel-art pieces in src/assets/ui (ai-frame, ai-button, ai-slot, ai-banner via CSS border-image, per-button icons in src/assets/ui/icons loaded by GameIcon); keeps one consistent look across both games without per-component art.
- The title-screen intro cutscene is rendered live on a canvas from in-game sprites, tiles and characters (src/components/IntroCutscene.tsx) instead of static images, so it stays faithful to the game's art.
- Both games share window chrome from src/components/GameModal.tsx (Modal/Section/Meter); tile variants come from TILE_VARIANTS/pickVariant in src/odyssey/tile-art.ts so both engines stay in sync.
- Mobile performance: the Quality governor samples the real rAF interval (GPU included) and starts touch devices at level 1; level ≥2 alone enables canvas-filter bloom and film grain, and expensive layers (bloom, lens glow, rays, motes, tone) are cached and refreshed only on heavyFx frames. Canvas filters and per-frame gradients are the main mobile bottleneck.
- Internal canvas resolution keeps the short side at 270 px with a capped long side, so portrait phones draw ~3× fewer pixels; the minimap is half resolution on mobile and the atlas image is a ≤960 px downscale to avoid memory crashes.
- The game loop wraps update/render in try/catch so a single bad frame never stops the game.
- Android bundles the browser-only Odyssey screen and assets at an intercepted HTTPS local origin using platform Activity/WebView; guest saves stay in app storage, accounts are excluded, and prototype signing is not Play Store signing.
- PetsPanel uses pets.ts rules and pet-play.ts state, committing through existing saves to preserve legacy world progress.

- AI-painted hero skins live in public/hero (48 px cells: 3 walk rows + 5 attack rows) and are registered at runtime into a copy of the Kaetram catalog; their indices come after the classic slot so saved Look.kskin values keep meaning.
- Character-free special effects come from one AI-painted sheet (public/fx/fx.png, 16 effects × 5 frames, built by scripts/build-fx-sheets.py) drawn by src/odyssey/vfx.ts; combo step, hit-stop and effect instances live on Game, never in the save, so balance and saves stay unchanged.
- Subdirectories have their own `AGENTS.md`; read it before changing files there (see src/odyssey/AGENTS.md).

- AI accessory sheets in public/look have 8 columns × 3 rows (front, right side, back), built from assets/look-src by scripts/build-look-sheets.py; look-gear.ts picks the row by facing so gear never looks pasted on.
