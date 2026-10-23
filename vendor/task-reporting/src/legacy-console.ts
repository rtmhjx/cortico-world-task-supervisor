/** Internal diagnostics retained from the three source adapters; never registered as an API 6 console. */
import type { ConfigGroup } from 'cortico/core/types.ts';
export interface LegacyConsoleDecl {
  label?: string;
  lamps?: Array<{ label: string; state: string; hint?: string }>;
  badges?: Array<{ label: string; value: string | number; tone?: 'on' | 'off' | 'plain' }>;
  panels?: Array<{ id: string; title: string; getMethods?: string[] }>;
  invoke?(panel: string, method: string, args: unknown[]): Promise<unknown>;
  config?: ConfigGroup[];
  promptDocs?: Array<{ key: string; title: string; description?: string; path: string; role?: string }>;
}
