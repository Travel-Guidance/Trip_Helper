import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { SearchProvider } from './store/SearchContext'
import { AuthProvider, useAuth } from './store/AuthContext'
import MainPage from './pages/MainPage'
import AiGenerationInputForm from './pages/AiGenerationInputForm'
import AiGenerationLoading from './pages/AiGenerationLoading'
import AiGenerationSchedule from './pages/AiGenerationSchedule'
import AiTravelDuration from './pages/AiTravelDuration'
import AiCollaborationPlanning from './pages/AiCollaborationPlanning'
import AiCollabLoading from './pages/AiCollabLoading'
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
import ProfilePage from './pages/ProfilePage'
import Photobook from './pages/Photobook'
import TravelPreparation from './pages/TravelPreparation'
import { API_BASE } from './api/config'
import OAuthCallback from './pages/OAuthCallback'
import { hasPendingPlanSaveAfterAuth, savePendingPlanAfterAuth } from './utils/pendingPlanSave'

function LegacyAccommodationRedirect() {
  const location = useLocation();
  const path = location.pathname.replace("/accomodation", "/accommodation");
  return <Navigate to={`${path}${location.search}`} replace />;
}

function RootRedirect() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? (
    <Navigate to="/home" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

function SocialAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    async function handleKakaoCallback() {
      if (!code) return;

      const profileParams = new URLSearchParams({ code });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(
        `${API_BASE}/auth/kakao/profile?${profileParams.toString()}`,
        {
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);
      if (!res.ok) {
        console.error("카카오 프로필 조회 실패:", await res.text());
        return;
      }

      const data = await res.json();
      if (data.token && data.user) {
        login(data.user, data.token);
        try {
          if (hasPendingPlanSaveAfterAuth()) {
            await savePendingPlanAfterAuth();
          }
        } catch (err) {
          console.error("Pending plan save failed:", err);
        }
      }
    }

    const nextPath = hasPendingPlanSaveAfterAuth()
      ? "/ai-generation-schedule"
      : "/home";
    handleKakaoCallback()
      .catch((err) => console.error("카카오 로그인 처리 실패:", err))
      .finally(() => navigate(nextPath, { replace: true }));
  }, [location.search, navigate, login]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
    <SearchProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/home" element={<MainPage />} />
          <Route path="/ai-travel" element={<Navigate to="/ai-generation-inputform" replace />} />
          <Route path="/ai-generation-inputform" element={<AiGenerationInputForm />} />
          <Route path="/ai-generation-loading" element={<AiGenerationLoading />} />
          <Route path="/ai-generation-schedule" element={<AiGenerationSchedule />} />
          <Route path="/ai-travel-duration" element={<AiTravelDuration />} />
          <Route path="/ai-collaboration-planning/:roomId" element={<AiCollaborationPlanning />} />
          <Route path="/ai-collab-loading" element={<AiCollabLoading />} />
          <Route path="/flights" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/seats/:offerId" element={<SeatSelection />} />
          <Route path="/booking/:offerId" element={<BookingForm />} />
          <Route path="/confirmation/:orderId" element={<Confirmation />} />
          <Route path="/esim" element={<ESimPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/kakao/callback" element={<SocialAuthRedirect />} />
          <Route path="/accommodation" element={<Accommodation />} />
          <Route path="/accommodation/results" element={<AccSearchResults />} />
          <Route path="/accommodation/confirmation/:bookingRef" element={<AccommodationConfirmation />} />
          <Route path="/accommodation/:hotelId" element={<AccommodationDetail />} />
          <Route path="/accomodation/*" element={<LegacyAccommodationRedirect />} />
          <Route path="/tour-ticket" element={<TourTicket />} />
          <Route path="/tour-ticket/:placeId" element={<TourTicketDetail />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/photobook" element={<Photobook />} />
          <Route path="/travel-prep" element={<TravelPreparation />} />
          <Route path="/auth/kakao/callback" element={<OAuthCallback />} />
          <Route path="/auth/google/callback" element={<OAuthCallback />} />
        </Routes>
      </BrowserRouter>
    </SearchProvider>
    </AuthProvider>
  );
}
