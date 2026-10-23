import { guardedDshMemoryWorld } from './guarded-world.ts';
import type { WorldDefinition } from 'cortico/world.ts';
import { dshMemoryDefaults, type DshMemoryConfigSection } from './config.ts';
import { DshMemoryWorld } from './world.ts';
import { nowIso } from 'cortico/core/util.ts';

export const DSHMEMORY: WorldDefinition<DshMemoryConfigSection> = {
  id: 'dshmemory', label: 'DSH 外部记忆', defaults: dshMemoryDefaults,
  create: ctx => guardedDshMemoryWorld(new DshMemoryWorld(ctx.cfg, { dataDir: ctx.dataDir, clock: () => nowIso(ctx.timezone) }), { dataDir: ctx.dataDir, operatorId: ctx.cfg.reportingOperatorId, stateFile: ctx.cfg.reportingStateFile, watchTrigger: ctx.cfg.watchTrigger }),
};
