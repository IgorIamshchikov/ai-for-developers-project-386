import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Booking from '@/pages/Booking'
import Home from '@/pages/Home'
import OwnerEventTypesNew from '@/pages/OwnerEventTypesNew'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Home />} path="/" />
        <Route element={<Booking />} path="/booking" />
        <Route element={<OwnerEventTypesNew />} path="/owner/event-types/new" />
      </Routes>
    </BrowserRouter>
  )
}

export default App
