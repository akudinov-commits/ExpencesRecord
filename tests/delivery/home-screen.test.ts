import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { expect, test } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('the app advertises same-origin standalone Home Screen installation and an Apple icon', () => {
  const html = readFileSync(join(root, 'apps/web/index.html'), 'utf8');
  expect(html).toMatch(/<link\s+rel="manifest"\s+href="\/manifest.webmanifest"/);
  expect(html).toMatch(/<link\s+rel="apple-touch-icon"\s+href="\/icons\/apple-touch-icon.png"/);
  expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes"');
  expect(html).toContain('<meta name="apple-mobile-web-app-title" content="ExpencesRecord"');
  expect(html).toContain('viewport-fit=cover');
});

test('install metadata points to valid sized local PNGs and launches the authenticated app root', () => {
  const manifestPath = join(root, 'apps/web/public/manifest.webmanifest');
  expect(existsSync(manifestPath), 'An installable app needs a published manifest').toBe(true);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { id: string; name: string; short_name: string; start_url: string; scope: string; display: string; icons: {src: string; sizes: string; type: string}[] };
  expect(manifest).toMatchObject({id:'/',name:'ExpencesRecord',short_name:'ExpencesRecord',start_url:'/',scope:'/',display:'standalone'});
  for (const size of [192,512]) {
    const icon = manifest.icons.find(icon => icon.sizes === `${size}x${size}`);
    expect(icon).toBeDefined(); expect(icon?.src).toMatch(/^\/icons\/[^/]+\.png$/); expect(icon?.type).toBe('image/png');
    const png = readFileSync(join(root,'apps/web/public',icon!.src));
    expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.readUInt32BE(16)).toBe(size); expect(png.readUInt32BE(20)).toBe(size);
  }
  const apple = readFileSync(join(root,'apps/web/public/icons/apple-touch-icon.png'));
  expect(apple.readUInt32BE(16)).toBe(180); expect(apple.readUInt32BE(20)).toBe(180);
});
