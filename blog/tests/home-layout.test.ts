import assert from 'node:assert/strict'
import test from 'node:test'

import { getTotalPages, paginatePosts, splitHomePosts } from '../lib/home-layout'

test('splitHomePosts keeps every post without dropping items', () => {
  for (let count = 0; count <= 20; count += 1) {
    const posts = Array.from({ length: count }, (_, i) => `post-${i + 1}`)
    const { featured, gridPosts, listPosts } = splitHomePosts(posts)
    const reconstructed = [featured, ...gridPosts, ...listPosts].filter(Boolean)

    assert.equal(reconstructed.length, posts.length)
    assert.deepEqual(reconstructed, posts)
  }
})

test('paginatePosts returns page slices based on page size', () => {
  const posts = Array.from({ length: 8 }, (_, i) => `post-${i + 1}`)

  assert.deepEqual(paginatePosts(posts, 1, 3), ['post-1', 'post-2', 'post-3'])
  assert.deepEqual(paginatePosts(posts, 2, 3), ['post-4', 'post-5', 'post-6'])
  assert.deepEqual(paginatePosts(posts, 3, 3), ['post-7', 'post-8'])
})

test('getTotalPages handles empty and non-empty collections', () => {
  assert.equal(getTotalPages(0, 5), 0)
  assert.equal(getTotalPages(1, 5), 1)
  assert.equal(getTotalPages(8, 5), 2)
})
