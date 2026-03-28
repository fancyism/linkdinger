import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_HOME_POSTS_PER_PAGE,
  DEFAULT_HOME_GRID_POSTS,
  getTotalPages,
  paginatePosts,
  splitHomePosts,
} from '../lib/home-layout'

// ============================================
// EDGE CASE: splitHomePosts
// ============================================

test('splitHomePosts returns null featured and empty arrays when posts is empty', () => {
  const { featured, gridPosts, listPosts } = splitHomePosts([] as string[])
  assert.equal(featured, null)
  assert.deepEqual(gridPosts, [])
  assert.deepEqual(listPosts, [])
})

test('splitHomePosts handles single post - featured only, no grid or list', () => {
  const { featured, gridPosts, listPosts } = splitHomePosts(['post-1'])
  assert.equal(featured, 'post-1')
  assert.deepEqual(gridPosts, [])
  assert.deepEqual(listPosts, [])
})

test('splitHomePosts splits correctly with exactly 7 posts (1 featured + 6 grid)', () => {
  const posts = Array.from({ length: 7 }, (_, i) => `post-${i + 1}`)
  const { featured, gridPosts, listPosts } = splitHomePosts(posts)
  assert.equal(featured, 'post-1')
  assert.deepEqual(gridPosts, ['post-2', 'post-3', 'post-4', 'post-5', 'post-6', 'post-7'])
  assert.deepEqual(listPosts, [])
})

test('splitHomePosts puts overflow posts into listPosts', () => {
  const posts = Array.from({ length: 10 }, (_, i) => `post-${i + 1}`)
  const { featured, gridPosts, listPosts } = splitHomePosts(posts)
  assert.equal(featured, 'post-1')
  assert.equal(gridPosts.length, DEFAULT_HOME_GRID_POSTS)
  assert.equal(listPosts.length, 3)
  assert.deepEqual(listPosts, ['post-8', 'post-9', 'post-10'])
})

test('splitHomePosts preserves all posts - no data loss', () => {
  for (let count = 0; count <= 20; count += 1) {
    const posts = Array.from({ length: count }, (_, i) => `post-${i + 1}`)
    const { featured, gridPosts, listPosts } = splitHomePosts(posts)
    const reconstructed = [featured, ...gridPosts, ...listPosts].filter(Boolean)
    assert.equal(reconstructed.length, posts.length, `Lost posts at count ${count}`)
    assert.deepEqual(reconstructed, posts, `Mismatch at count ${count}`)
  }
})

// ============================================
// EDGE CASE: paginatePosts
// ============================================

test('paginatePosts returns empty array for empty input', () => {
  assert.deepEqual(paginatePosts([] as string[], 1, 5), [])
})

test('paginatePosts returns all posts when page size >= total', () => {
  const posts = Array.from({ length: 5 }, (_, i) => `post-${i + 1}`)
  assert.deepEqual(paginatePosts(posts, 1, 10), posts)
})

test('paginatePosts returns empty array when page is beyond available pages', () => {
  const posts = Array.from({ length: 5 }, (_, i) => `post-${i + 1}`)
  assert.deepEqual(paginatePosts(posts, 10, 5), [])
})

test('paginatePosts handles page 1 correctly', () => {
  const posts = Array.from({ length: 8 }, (_, i) => `post-${i + 1}`)
  assert.deepEqual(paginatePosts(posts, 1, 3), ['post-1', 'post-2', 'post-3'])
})

test('paginatePosts handles middle page correctly', () => {
  const posts = Array.from({ length: 8 }, (_, i) => `post-${i + 1}`)
  assert.deepEqual(paginatePosts(posts, 2, 3), ['post-4', 'post-5', 'post-6'])
})

test('paginatePosts handles last partial page correctly', () => {
  const posts = Array.from({ length: 8 }, (_, i) => `post-${i + 1}`)
  assert.deepEqual(paginatePosts(posts, 3, 3), ['post-7', 'post-8'])
})

test('paginatePosts normalizes invalid page numbers to 1', () => {
  const posts = Array.from({ length: 5 }, (_, i) => `post-${i + 1}`)
  assert.deepEqual(paginatePosts(posts, 0, 3), ['post-1', 'post-2', 'post-3'])
  assert.deepEqual(paginatePosts(posts, -1, 3), ['post-1', 'post-2', 'post-3'])
  assert.deepEqual(paginatePosts(posts, 1.5, 3), ['post-1', 'post-2', 'post-3'])
})

test('paginatePosts handles NaN page as page 1', () => {
  const posts = Array.from({ length: 5 }, (_, i) => `post-${i + 1}`)
  assert.deepEqual(paginatePosts(posts, NaN, 3), ['post-1', 'post-2', 'post-3'])
})

// ============================================
// EDGE CASE: getTotalPages
// ============================================

test('getTotalPages returns 0 for zero items', () => {
  assert.equal(getTotalPages(0, 5), 0)
})

test('getTotalPages returns 0 for negative items', () => {
  assert.equal(getTotalPages(-5, 5), 0)
})

test('getTotalPages returns 1 for exact multiple', () => {
  assert.equal(getTotalPages(10, 5), 2)
})

test('getTotalPages rounds up for partial pages', () => {
  assert.equal(getTotalPages(1, 5), 1)
  assert.equal(getTotalPages(6, 5), 2)
  assert.equal(getTotalPages(11, 5), 3)
})

test('getTotalPages uses default page size when not specified', () => {
  // DEFAULT_HOME_POSTS_PER_PAGE = 13
  assert.equal(getTotalPages(13), 1)
  assert.equal(getTotalPages(14), 2)
  assert.equal(getTotalPages(26), 2)
  assert.equal(getTotalPages(27), 3)
})

// ============================================
// DEFAULTS: Verify constants
// ============================================

test('DEFAULT_HOME_POSTS_PER_PAGE is 13', () => {
  assert.equal(DEFAULT_HOME_POSTS_PER_PAGE, 13)
})

test('DEFAULT_HOME_GRID_POSTS is 6', () => {
  assert.equal(DEFAULT_HOME_GRID_POSTS, 6)
})
