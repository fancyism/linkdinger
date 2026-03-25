import { redirect } from 'next/navigation'

const DEFAULT_LOCALE = 'en'

export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}`)
}
