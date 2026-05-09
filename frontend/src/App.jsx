import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { SearchProvider } from './store/SearchContext'
import MainPage from './pages/MainPage'
import AiTravelPage from './pages/AiTravelPage'
import AiGenerationInputForm from './pages/AiGenerationInputForm'
import AiGenerationLoading from './pages/AiGenerationLoading'
import AiGenerationSchedule from './pages/AiGenerationSchedule'
import AiTravelDuration from './pages/AiTravelDuration'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import SeatSelection from './pages/SeatSelection'
import BookingForm from './pages/BookingForm'
import Confirmation from './pages/Confirmation'
import ESimPage from './pages/ESimPage'
import LoginPage from './pages/LoginPage'
import Accommodation from './pages/Accommodation'
import AccSearchResults from './pages/AccSearchResults'
import AccommodationDetail from './pages/AccommodationDetail'
import AccommodationConfirmation from './pages/AccommodationConfirmation'
import TourTicket from './pages/TourTicket'
import TourTicketDetail from './pages/TourTicketDetail'

function LegacyAccommodationRedirect() {
  const location = useLocation()
  const path = location.pathname.replace('/accomodation', '/accommodation')
  return <Navigate to={`${path}${location.search}`} replace />
}

export default function App() {
  return (
    <SearchProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<MainPage />} />
          <Route path="/ai-travel" element={<AiTravelPage />} />
          <Route path="/ai-generation-inputform" element={<AiGenerationInputForm />} />
          <Route path="/ai-generation-loading" element={<AiGenerationLoading />} />
          <Route path="/ai-generation-schedule" element={<AiGenerationSchedule />} />
          <Route path="/ai-travel-duration" element={<AiTravelDuration />} />
          <Route path="/flights" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/seats/:offerId" element={<SeatSelection />} />
          <Route path="/booking/:offerId" element={<BookingForm />} />
          <Route path="/confirmation/:orderId" element={<Confirmation />} />
          <Route path="/esim" element={<ESimPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/accommodation" element={<Accommodation />} />
          <Route path="/accommodation/results" element={<AccSearchResults />} />
          <Route path="/accommodation/confirmation/:bookingRef" element={<AccommodationConfirmation />} />
          <Route path="/accommodation/:hotelId" element={<AccommodationDetail />} />
          <Route path="/accomodation/*" element={<LegacyAccommodationRedirect />} />
          <Route path="/tour-ticket" element={<TourTicket />} />
          <Route path="/tour-ticket/:placeId" element={<TourTicketDetail />} />
        </Routes>
      </BrowserRouter>
    </SearchProvider>
  )
}
