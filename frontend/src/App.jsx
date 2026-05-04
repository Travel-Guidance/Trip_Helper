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
import Accomodation from './pages/Accomodation'
import AccSearchResults from './pages/AccSearchResults'
import AccomodationDetail from './pages/AccomodationDetail'
import AccomodationConfirmation from './pages/AccomodationConfirmation'
import TourTicket from './pages/TourTicket'
import TourTicketDetail from './pages/TourTicketDetail'

export default function App() {
  return (
    <SearchProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<MainPage />} />
          <Route path="/ai-travel" element={<AiTravelPage />} />
          <Route path="/flights" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/seats/:offerId" element={<SeatSelection />} />
          <Route path="/booking/:offerId" element={<BookingForm />} />
          <Route path="/confirmation/:orderId" element={<Confirmation />} />
          <Route path="/esim" element={<ESimPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/accomodation" element={<Accomodation />} />
          <Route path="/accomodation/results" element={<AccSearchResults />} />
          <Route path="/accomodation/confirmation/:bookingRef" element={<AccomodationConfirmation />} />
          <Route path="/accomodation/:hotelId" element={<AccomodationDetail />} />
          <Route path="/tour-ticket" element={<TourTicket />} />
          <Route path="/tour-ticket/:placeId" element={<TourTicketDetail />} />
        </Routes>
      </BrowserRouter>
    </SearchProvider>
  )
}
