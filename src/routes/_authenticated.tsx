import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCachedAuthSession } from '#/server/auth'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // Uses 0ms in-memory cache for client-side tab switching
    const auth = await getCachedAuthSession()
    if (!auth.session || !auth.user) {
      throw redirect({
        to: '/auth/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }
    return { auth }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
