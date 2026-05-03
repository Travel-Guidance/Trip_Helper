import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SearchProvider } from './store/SearchContext'
import MainPage from './pages/MainPage'
import AiTravelPage from './pages/AiTravelPage'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import SeatSelection from './pages/SeatSelection'
import BookingForm from './pages/BookingForm'
import Confirmation from './pages/Confirmation'
import ESimPage from './pages/ESimPage'
import LoginPage from './pages/LoginPage'
import './App.css'

export default function App() {
  return (
    <SearchProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/ai-travel" element={<AiTravelPage />} />
          <Route path="/flights" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/seats/:offerId" element={<SeatSelection />} />
          <Route path="/booking/:offerId" element={<BookingForm />} />
          <Route path="/confirmation/:orderId" element={<Confirmation />} />
          <Route path="/esim" element={<ESimPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </SearchProvider>
  )
}
