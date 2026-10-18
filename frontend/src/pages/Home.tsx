import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/lib/routes'

function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold">Календарь звонков</h1>
        <p className="text-lg text-muted-foreground">
          Выберите свободный слот в календаре и запишитесь на звонок в удобное время — без
          регистрации.
        </p>
      </div>
      <Link to={ROUTES.booking} className={buttonVariants()}>
        Записаться на звонок
      </Link>
    </div>
  )
}

export default Home
