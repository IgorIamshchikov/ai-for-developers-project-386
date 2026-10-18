import { Outlet } from 'react-router-dom'

import Header from '@/components/Header'

function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <Outlet />
    </div>
  )
}

export default Layout
