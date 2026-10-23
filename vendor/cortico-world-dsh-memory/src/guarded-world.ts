/** Tool access follows the shared reporting gate; native background maintenance remains local. */
import { join } from 'node:path';
import type { ToolDef, ToolOutcome, World, WorldHost } from 'cortico/core/types.ts';
import { ReportingGate } from '../../task-reporting/src/gate.ts';

export interface DshMemoryReportingOptions {
  dataDir: string;
  operatorId?: string;
  stateFile?: string;
  watchTrigger?: string;
  clock?: () => number;
  reportingDeniedRoots?: readonly string[];
}

/** Proxy every World capability to its original receiver, guarding model tool handlers only. */
export function guardedDshMemoryWorld<T extends World>(inner: T, options: DshMemoryReportingOptions): T {
  let gate: ReportingGate | undefined;
  let host: WorldHost | undefined;
  let stopping = false;
  const calls = new Set<Promise<unknown>>();
  const disabled = (): ToolOutcome => ({ failed: true, text: 'TASK_REPORTING_DISABLED: DSH 外部记忆工具已关闭；请在指定 QQ 私聊以 #@ 开启远程监管。' });
  const check = (): number | undefined => {
    if (!options.operatorId) return undefined;
    if (!gate || !host || stopping) throw new Error('TASK_REPORTING_UNAVAILABLE');
    gate.syncCommands(host.store);
    if (!gate.enabled()) throw new Error('TASK_REPORTING_DISABLED');
    return Number(gate.snapshot().epoch);
  };
  const tools = (): ToolDef[] => inner.tools().map(tool => ({
    ...tool,
    handler: (args, context) => {
      const run = async (): Promise<string | ToolOutcome> => {
        if (options.operatorId) {
          try { check(); } catch { return disabled(); }
        }
        const epoch = options.operatorId ? Number(gate!.snapshot().epoch) : undefined;
        const result = await tool.handler.call(tool, args, context);
        if (options.operatorId) {
          try { if (check() !== epoch) return { failed: true, text: 'TASK_REPORTING_CHANGED: 监管模式已变化，本次结果不再提供；已开始的操作可能已经执行，请重新核对状态。' }; }
          catch { return disabled(); }
        }
        return result;
      };
      const task = run(); calls.add(task);
      void task.finally(() => calls.delete(task)).catch(() => {});
      return task;
    },
  }));
  const start = async (value: WorldHost): Promise<void> => {
    stopping = false;
    if (options.operatorId) {
      // The source World commits a real host cursor for watch deliveries.
      // Record mode keeps those bodies local without inventing a host receipt.
      if (options.watchTrigger && options.watchTrigger !== 'record') throw new Error('DSH memory reporting gate requires watchTrigger=record.');
      gate = new ReportingGate({ stateFile: options.stateFile || join(options.dataDir, 'task-reporting', 'gate.sqlite'), operatorId: options.operatorId, clock: options.clock, deniedRoots: options.reportingDeniedRoots });
      try { gate.syncCommands(value.store); } catch (error) { gate.close(); gate = undefined; throw error; }
    }
    host = value;
    try { await inner.start(value); }
    catch (error) { gate?.close(); gate = undefined; host = undefined; throw error; }
  };
  const stop = async (): Promise<void> => {
    stopping = true;
    await Promise.allSettled([...calls]);
    try { await inner.stop(); }
    finally { gate?.close(); gate = undefined; host = undefined; }
  };
  const bound = new Map<PropertyKey, unknown>();
  return new Proxy(inner, {
    get(target, property) {
      if (property === 'tools') return tools;
      if (property === 'start') return start;
      if (property === 'stop') return stop;
      const value = Reflect.get(target, property, target);
      if (typeof value !== 'function') return value;
      if (!bound.has(property)) bound.set(property, value.bind(target));
      return bound.get(property);
    },
  });
}
