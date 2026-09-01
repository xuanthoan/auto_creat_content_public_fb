import { test, expect } from '@playwright/test';
import { invoke, isTauri } from './helpers/tauri';
import { ensureProvider, DEFAULT_MODEL } from './helpers/provider';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:20128/v1';

const mockImplCode = `
window.__TAURI_MOCK__ = true;
window.__TAURI_INTERNALS__ = {};
window.__TAURI_MOCK_IMPL__ = async (cmd, args) => {
  const baseUrl = ${JSON.stringify(BASE_URL)};
  switch (cmd) {
    case 'list_providers':
      return [
        {
          id: 'custom-provider',
          displayName: 'Custom provider',
          baseUrl: baseUrl,
          protocol: 'openai-completions',
          models: ['xoay-vong-worker-web-128k'],
          hasApiKey: true,
        },
      ];
    case 'get_active_provider':
      return {
        id: 'custom-provider',
        displayName: 'Custom provider',
        baseUrl: baseUrl,
        protocol: 'openai-completions',
        models: ['xoay-vong-worker-web-128k'],
        hasApiKey: true,
      };
    case 'update_provider': {
      const protocol = args?.payload?.protocol;
      if (protocol === 'anthropic-messages') {
        throw new Error("Protocol 'anthropic-messages' chưa hỗ trợ ở MVP, chỉ 'openai-completions' được enable");
      }
      return {
        id: 'custom-provider',
        displayName: 'Custom provider',
        baseUrl: baseUrl,
        protocol: 'openai-completions',
        models: ['xoay-vong-worker-web-128k'],
        hasApiKey: true,
      };
    }
    case 'create_provider': {
      const id = args?.payload?.id;
      if (!id || !/^[a-z][a-z0-9-]*$/.test(id) || id.includes('--')) {
        throw new Error('Provider ID không hợp lệ: phải lowercase, bắt đầu bằng chữ cái, chỉ chứa a-z, 0-9, \\'-\\', không --, 1-64 ký tự');
      }
      return { id, hasApiKey: true };
    }
    case 'fetch_provider_models':
      return ['xoay-vong-worker-web-128k'];
    case 'delete_provider':
      return;
    default:
      throw new Error('Unknown mock command: ' + cmd);
  }
};
`;

test.describe('Providers E2E (real server)', () => {
  test.skip(
    (!process.env.E2E_API_KEY && !process.env.CI && process.env.E2E_MOCK !== 'true'),
    'E2E_API_KEY not set, skipping real server test. Set E2E_API_KEY=sk-... to run.'
  );

  test.beforeEach(async ({ page }) => {
    if (process.env.E2E_MOCK === 'true') {
      await page.addInitScript(mockImplCode);
    }
    await page.goto('/');
    // Wait for Tauri to be ready; if not in Tauri, skip
    const tauri = await isTauri(page);
    if (!tauri) {
      test.skip(true, 'Not in Tauri window, skip. Run via npm run tauri:dev + tauri-driver');
    }
  });

  test('listProviders returns custom-provider default', async ({ page }) => {
    const list: any[] = await invoke(page, 'list_providers');
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
    const custom = list.find((p) => p.id === 'custom-provider');
    expect(custom).toBeTruthy();
    expect(custom.baseUrl).toContain('http');
    expect(custom.protocol).toBe('openai-completions');
  });

  test('updateProvider and get_active_provider', async ({ page }) => {
    const active = await ensureProvider(page);
    expect(active.id).toBe('custom-provider');
    expect(active.hasApiKey).toBe(true);
    expect(active.baseUrl).toBe(BASE_URL);
  });

  test('fetch_provider_models with real server', async ({ page }) => {
    await ensureProvider(page);
    const models: string[] = await invoke(page, 'fetch_provider_models', { id: 'custom-provider' });
    expect(Array.isArray(models)).toBe(true);
    // Real server should return at least the requested model
    expect(models.length).toBeGreaterThan(0);
    expect(models).toContain(DEFAULT_MODEL);
  });

  test('create_provider with invalid id should fail (MVP validation)', async ({ page }) => {
    try {
      await invoke(page, 'create_provider', {
        payload: {
          id: 'Invalid_ID',
          baseUrl: 'http://localhost:20128/v1',
          protocol: 'openai-completions',
          models: [DEFAULT_MODEL],
          apiKey: 'dummy',
        },
      });
      throw new Error('should have failed');
    } catch (e) {
      expect(String(e)).toContain('Provider ID không hợp lệ');
    }
  });

  test('update_provider with invalid protocol should fail', async ({ page }) => {
    try {
      await invoke(page, 'update_provider', {
        id: 'custom-provider',
        payload: { protocol: 'anthropic-messages' },
      });
      throw new Error('should have failed');
    } catch (e) {
      expect(String(e)).toContain('chưa hỗ trợ');
    }
  });
});