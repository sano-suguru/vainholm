# AGENTS.md - src/dungeon/config

**Generated**: 2026-01-20 | **Commit**: 35f9005 | **Parent**: [../AGENTS.md](../AGENTS.md)

Region-specific configurations for BSP dungeon generation.

## Structure

| File | Region | Theme |
|------|--------|-------|
| `hrodrgraf.ts` | Hróðrgraf (栄光の墓) | Temple ruins, collapse zones |
| `rotmyrkr.ts` | Rótmyrkr (根の闇) | Corrupted roots, traps + hazards |
| `gleymdariki.ts` | Gleymdaríki (忘却の王国) | Gothic fortress, more rooms |
| `upphafsdjup.ts` | Upphafsdjúp (起源の深淵) | Primordial void |
| `index.ts` | Exports `REGION_CONFIGS[]` + floor lookup utilities |

## RegionConfig Structure

Each config exports a `RegionConfig` object (see `../types.ts`):

```typescript
const CONFIG: RegionConfig = {
  theme: 'region_id',           // Used for texture/asset lookup
  name: 'Display Name',         // English
  displayName: '日本語名',       // Japanese
  startFloor: 1,                // Global floor number
  size: { base, perFloor },     // Floor dimensions
  bspConfig: { ... },           // Room/corridor generation params
  decorationConfig?: { ... },   // pillar, rubble, bone_pile, etc.
  trapConfig?: { ... },         // web, pit, spike + distance scaling
  hazardConfig?: { ... },       // toxic_marsh, miasma, blight
  lightingConfig?: { ... },     // brazier, wall_torch placement
  doorConfig?: { ... },         // regular, locked, secret chances
  multiTileConfig?: { ... },    // fallen_pillar, broken_statue
  collapseConfig?: { ... },     // Floor collapse zones (Hróðrgraf only)
};
```

## Regional Differences

| Feature | Hróðrgraf | Rótmyrkr | Gleymdaríki |
|---------|-----------|----------|-------------|
| Base Size | 40x40 | 45x45 | 50x50 |
| Traps | None | 40% (web, pit, spike) | 35% (pressure_plate, spike, pit) |
| Hazards | None | 50% (toxic, miasma, blight) | None |
| Lighting | 15% | 8% (darker) | 12% |
| Collapse | 60% | None | None |
| Secret Doors | 10% | 20% | 15% |

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new region | Create `newregion.ts`, add to `REGION_CONFIGS` in `index.ts` |
| Add decoration type | `decorationConfig.decorationTiles` (weights must sum to ~1.0) |
| Add trap type | `trapConfig.trapTiles` |
| Modify floor size | `size.base` or `size.perFloor[floorNumber]` |
| Change lighting density | `lightingConfig.lightingChance` |

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Weights > 1.0 | Tile weights are probabilities, must be normalized |
| Missing `startFloor` | Floor lookup depends on sequential ordering |
| Skip `index.ts` registration | Region won't be discoverable |
