import assert from 'node:assert/strict';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { World } from 'cortico/core/types.ts';
import type { WorldContext } from 'cortico/world.ts';
import { TaskSupervisorWorld } from '../src/world.ts';
import { TASK_SUPERVISOR_CONFIG_GROUP, taskSupervisorDefaults, type TaskSupervisorConfig } from '../src/config.ts';

test('the real World language argument localizes human metadata without mutating identifiers, config or model text', () => {
  const context = {
    cfg: taskSupervisorDefaults(), dataDir: join(tmpdir(), 'synthetic-task-supervisor-languages'),
    secret: () => '', persist: () => {}, storeSecret: () => {}, restart: async () => {},
  } as unknown as WorldContext<TaskSupervisorConfig>;
  const world: World = new TaskSupervisorWorld({ context });
  const languages = ['zh', 'zh-Hant', 'en', 'ja', 'ko', 'fr', 'de', 'es-419', 'pt-BR', 'it', 'ru'] as const;
  const originalSchema = structuredClone(TASK_SUPERVISOR_CONFIG_GROUP.schema);
  const modelVariables = world.envPromptVars();
  const tools = world.tools().map(({name, description}) => ({name, description}));
  const english = world.webUi!('en');
  for (const language of languages) {
    const view = world.webUi!(language);
    const group = view.config![0], panel = view.panels![0], prompt = view.promptDocs![0];
    assert.equal(group.id, TASK_SUPERVISOR_CONFIG_GROUP.id);
    assert.equal(panel.id, 'setup');
    assert.equal(typeof panel.title, 'string');
    assert.equal(typeof panel.description, 'string');
    assert.ok(panel.description!.length > 10);
    if (language !== 'en') assert.notEqual(panel.description, english.panels![0].description);
    assert.equal(prompt.key, english.promptDocs![0].key);
    assert.equal(prompt.path, english.promptDocs![0].path);
    assert.equal(prompt.role, 'envPrompt');
    assert.deepEqual(prompt.vars!.map(variable => variable.name), english.promptDocs![0].vars!.map(variable => variable.name));
    const owner = group.schema.properties!['worlds.tasksupervisor.ownerQQ'];
    assert.equal(typeof owner.title, 'string');
    assert.notEqual(owner.title, 'ownerQQ');
    assert.deepEqual(world.envPromptVars(), modelVariables);
    assert.deepEqual(world.tools().map(({name, description}) => ({name, description})), tools);
  }
  assert.deepEqual(TASK_SUPERVISOR_CONFIG_GROUP.schema, originalSchema);
  assert.equal(english.panels![0].description, world.webUi!('en').panels![0].description);
});
