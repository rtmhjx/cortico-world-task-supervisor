import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { ToolDef } from 'cortico/core/types.ts';
import { ConversationControlWorld } from '../vendor/cortico-world-conversation-control/src/world.ts';
import { conversationControlDefaults } from '../vendor/cortico-world-conversation-control/src/config.ts';
import { CodexBridgeWorld } from '../vendor/cortico-world-codex-bridge/src/world.ts';
import { codexBridgeDefaults } from '../vendor/cortico-world-codex-bridge/src/config.ts';
import { DshMemoryWorld } from '../vendor/cortico-world-dsh-memory/src/world.ts';
import { dshMemoryDefaults } from '../vendor/cortico-world-dsh-memory/src/config.ts';
import { toolDeclaration } from './world.ts';
/** Constructors only: describing the package never starts or reads a source. */
export function catalogTools():ToolDef[]{
  const root=join(tmpdir(),'task-supervisor-description-project');
  const conversation=new ConversationControlWorld({cfg:conversationControlDefaults(),dataDir:root,secret:async()=>undefined});
  const codex=new CodexBridgeWorld({cfg:{...codexBridgeDefaults(),workspaceFilesEnabled:true},dataDir:root});
  const memory=new DshMemoryWorld({...dshMemoryDefaults(),workspaceRoots:JSON.stringify([root]),workspaceFilesEnabled:true});
  return [...conversation.tools(),...codex.tools(),...memory.tools()].map(toolDeclaration);
}
