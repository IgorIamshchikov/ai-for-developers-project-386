import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Layout from '@/components/Layout'
import { ROUTES } from '@/lib/routes'
import Booking from '@/pages/Booking'
import Home from '@/pages/Home'
import OwnerBookings from '@/pages/OwnerBookings'
import OwnerEventTypesNew from '@/pages/OwnerEventTypesNew'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route element={<Home />} path={ROUTES.home} />
          <Route element={<Booking />} path={ROUTES.booking} />
          <Route element={<OwnerEventTypesNew />} path={ROUTES.ownerEventTypesNew} />
          <Route element={<OwnerBookings />} path={ROUTES.ownerBookings} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
