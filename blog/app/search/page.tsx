import SearchClient from './client'
import { getAllPosts } from '@/lib/posts'

export const metadata = {
  title: 'Search | Linkdinger',
  description: 'Search posts',
}

export default function SearchPage() {
  const posts = getAllPosts()
  return <SearchClient posts={posts} />
}
