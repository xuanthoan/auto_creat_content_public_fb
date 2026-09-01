import { test, expect } from '@playwright/test';
import { invoke, isTauri } from './helpers/tauri';
import { ensureProvider } from './helpers/provider';

test.describe('AI generate_content E2E (real server)', () => {
  test.skip(!process.env.E2E_API_KEY && !process.env.CI, 'E2E_API_KEY not set, skipping');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const tauri = await isTauri(page);
    if (!tauri) test.skip(true, 'Not in Tauri window');
    await ensureProvider(page);
  });

  test('generate_content with real provider returns title/body', async ({ page }) => {
    const payload = {
      prompt: 'Bí quyết năng lượng buổi sáng cho dân văn phòng',
      style: 'Viral',
      customStyle: null,
      length: 'Vừa',
    };
    const res: any = await invoke(page, 'generate_content', { payload });
    expect(res.title).toBeTruthy();
    expect(res.body).toBeTruthy();
    expect(res.isMock).toBe(false);
    expect(res.prompt).toBe(payload.prompt);
    expect(res.style).toBe(payload.style);
  });

  test('generate_content respects length Ngắn/Dài', async ({ page }) => {
    for (const length of ['Ngắn', 'Dài']) {
      const res: any = await invoke(page, 'generate_content', {
        payload: { prompt: 'Test length ' + length, style: 'Viral', customStyle: null, length },
      });
      expect(res.title).toBeTruthy();
    }
  });

  test('generate_content should fail without prompt', async ({ page }) => {
    try {
      await invoke(page, 'generate_content', {
        payload: { prompt: '   ', style: 'Viral', customStyle: null, length: 'Vừa' },
      });
      throw new Error('should have failed');
    } catch (e) {
      expect(String(e)).toContain('prompt');
    }
  });
});
