import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Booking from '@/pages/Booking'
import Home from '@/pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Home />} path="/" />
        <Route element={<Booking />} path="/booking" />
      </Routes>
    </BrowserRouter>
  )
}

export default App
