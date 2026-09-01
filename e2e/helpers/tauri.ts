import type { Page } from '@playwright/test';

export async function isTauri(page: Page): Promise<boolean> {
  return page.evaluate(() => '__TAURI_INTERNALS__' in window);
}

export async function invoke<T = unknown>(page: Page, command: string, args?: Record<string, unknown>): Promise<T> {
  const hasTauri = await isTauri(page);
  if (!hasTauri) {
    throw new Error('Not in Tauri window (__TAURI_INTERNALS__ missing). Run via tauri-driver / npm run tauri:dev');
  }
  return page.evaluate(
    async ({ cmd, a }) => {
      // @ts-ignore
      if ((window as any).__TAURI_MOCK__) {
        // @ts-ignore
        return (window as any).__TAURI_MOCK_IMPL__(cmd, a);
      }
      // @ts-ignore
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke(cmd, a);
    },
    { cmd: command, a: args }
  );
}
