import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Business from './pages/Business';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerShowBookings from './pages/owner/OwnerShowBookings';

import AdminDashboard from './pages/admin/AdminDashboard';

import CreatorDashboard from './pages/creator/CreatorDashboard';

function NotFound() {
  return (
    <div className="container page">
      <div className="empty-state">Page not found.</div>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/business" element={<Business />} />

          <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
            <Route path="/shows/:id/seats" element={<SeatSelection />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />
            <Route path="/my-bookings" element={<MyBookings />} />
          </Route>

          <Route element={<ProtectedRoute roles={['THEATRE_OWNER']} />}>
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/owner/shows/:id/bookings" element={<OwnerShowBookings />} />
          </Route>

          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={['MOVIE_CREATOR']} />}>
            <Route path="/creator" element={<CreatorDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
