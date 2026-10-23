export type TaskSupervisorUiLanguage = string | { language?: string };
export interface TaskSupervisorUiCopy extends Record<string, string | readonly string[]> {
  metadataConfigTitle: string;
  metadataPanelTitle: string;
  metadataPanelDescription: string;
  metadataPromptTitle: string;
  metadataPromptDescription: string;
  metadataOwnerDescription: string;
  metadataModeDescription: string;
}
export function selectLanguage(language?: TaskSupervisorUiLanguage): string;
export function uiCopy(language?: TaskSupervisorUiLanguage): TaskSupervisorUiCopy;
export function uiFieldLabel(key: string, language?: TaskSupervisorUiLanguage): string;
