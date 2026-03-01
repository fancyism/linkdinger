export const DEFAULT_HOME_POSTS_PER_PAGE = 13
export const DEFAULT_HOME_GRID_POSTS = 6

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  const normalized = Math.floor(parsed)
  return normalized > 0 ? normalized : fallback
}

export function getHomePostsPerPage(): number {
  return toPositiveInteger(process.env.HOME_POSTS_PER_PAGE, DEFAULT_HOME_POSTS_PER_PAGE)
}

export function getHomeGridPostsCount(): number {
  return toPositiveInteger(process.env.HOME_GRID_POSTS, DEFAULT_HOME_GRID_POSTS)
}

export function getTotalPages(totalItems: number, pageSize = getHomePostsPerPage()): number {
  if (totalItems <= 0) return 0
  return Math.ceil(totalItems / pageSize)
}

export function paginatePosts<T>(posts: T[], page: number, pageSize = getHomePostsPerPage()): T[] {
  const currentPage = Math.max(1, Math.floor(page) || 1)
  const startIndex = (currentPage - 1) * pageSize
  return posts.slice(startIndex, startIndex + pageSize)
}

export function splitHomePosts<T>(posts: T[]): {
  featured: T | null
  gridPosts: T[]
  listPosts: T[]
} {
  const featured = posts[0] ?? null
  const remaining = posts.slice(1)
  const gridCount = getHomeGridPostsCount()

  return {
    featured,
    gridPosts: remaining.slice(0, Math.min(gridCount, remaining.length)),
    listPosts: remaining.slice(Math.min(gridCount, remaining.length)),
  }
}
