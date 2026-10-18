import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/lib/routes'

function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-background px-6 py-3">
      <Link to={ROUTES.home} className="text-lg font-semibold">
        Календарь звонков
      </Link>
      <nav className="flex items-center gap-2">
        <Link to={ROUTES.booking} className={buttonVariants()}>
          Записаться
        </Link>
        <Link to={ROUTES.ownerBookings} className={buttonVariants({ variant: 'outline' })}>
          Предстоящие события
        </Link>
      </nav>
    </header>
  )
}

export default Header
