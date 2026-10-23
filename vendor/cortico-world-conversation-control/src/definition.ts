import type { WorldDefinition } from 'cortico/world.ts';
import { conversationControlDefaults, type ConversationControlConfigSection } from './config.ts';
import { ConversationControlWorld } from './world.ts';

export const CONVERSATIONCONTROL: WorldDefinition<ConversationControlConfigSection> = {
  id: 'conversationcontrol', label: '会话控制', defaults: conversationControlDefaults,
  create: ctx => new ConversationControlWorld({ cfg: ctx.cfg, dataDir: ctx.dataDir, secret: async () => ctx.secret(ctx.cfg.tokenSecret) }),
};
