import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAssetUrl } from '../asset-url-resolver.mjs';

test('resolves relative markdown image paths against the article URL', () => {
  const articleUrl = 'https://cipherops-blog.github.io/CipherOps/courses/networks/1.%20Introduction.md';
  const resolved = resolveAssetUrl('./1GeographicScope.svg', articleUrl);

  assert.equal(resolved, 'https://cipherops-blog.github.io/CipherOps/courses/networks/1GeographicScope.svg');
});

test('preserves absolute URLs and data URLs', () => {
  assert.equal(resolveAssetUrl('https://example.com/image.svg', 'https://cipherops-blog.github.io/CipherOps/courses/networks/1.%20Introduction.md'), 'https://example.com/image.svg');
  assert.equal(resolveAssetUrl('data:image/svg+xml;base64,abc', 'https://cipherops-blog.github.io/CipherOps/courses/networks/1.%20Introduction.md'), 'data:image/svg+xml;base64,abc');
});
