import { Route, Routes } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import ScrollToTop from "../components/layout/ScrollToTop";
import RequireAuth from "../components/layout/RequireAuth";
import RequirePermission from "../components/layout/RequirePermission";
import { ROUTE_ACCESS } from "./routeAccess";
import RevenueOverview from "../components/admin/dashboard/RevenueOverview";
import DestinationForm from "../pages/admin/destinations/DestinationForm";
import DestinationsList from "../pages/admin/destinations/DestinationsList";
import BookingList from "../pages/admin/bookings/BookingList";
import Customers from "../components/admin/customers/Customers";
import ExperienceDetail from "../pages/public/ExperienceDetail";
import CreateCustomer from "../pages/admin/customers/CreateCustomer";
import CreateUsers from "../pages/admin/users/CreateUsers";
import DestinationDetail from "../pages/public/DestinationDetailPage";
import HeroSection from "../pages/public/HeroSection";
import TourLight from "../pages/public/tour/TourLight";
import AuthenticKhmer from "../components/tour/hero_section/AuthenticKhmer";
import TravelSection from "../pages/public/PracticalSection";
import { RegisterForm } from "../pages/auth/RegisterForm";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import PageListUser from "../pages/admin/users/PageListUser";
import GuidesList from "../pages/admin/guides/GuidesList";
import SettingsPage from "../pages/admin/settings/SettingsPage";
import FeaturedTourPackages from "../pages/public/TourPackages";
import HomePage from "../pages/public/HomePage";
import ToursDetailContent from "../components/tour/ToursDetailContent/ToursDetailContent";
import PopularDestinations from "../components/tour/PopularDestinations";
import TopAttractions from "../pages/public/TopAttractions";
import DestinationsPage from "../pages/public/DestinationsPublicPage";
import { AvailableTours } from "../pages/public/AvailableTours";
import ToursCatalogPage from "../pages/public/ToursCatalogPage";
import TourDetailPage from "../pages/public/TourDetailPage";
import ToursPage from "../pages/public/ToursPage";
import CategoriesPage from "../pages/public/CategoriesPage";
import AboutPage from "../pages/public/AboutPage";
import ContactPage from "../pages/public/ContactPage";
import TourListPage from "../pages/admin/tours/TourListPage";
import DashboardEntry from "../components/layout/DashboardEntry";

const HERO_IMAGES = [
  "https://i.pinimg.com/1200x/ed/bf/73/edbf7353393cc3d039792dc89a0dd4b6.jpg",
  "https://i.pinimg.com/1200x/bf/49/1c/bf491c2d5cea22db9afaf280cba0466c.jpg",
  "https://i.pinimg.com/736x/2e/d1/d4/2ed1d4c57b64b38d2e09c346c3e771d7.jpg",
  "https://i.pinimg.com/1200x/ed/dd/ca/edddca5d0d69b6071e5bb630135f69c5.jpg",
];

const heroSection = <HeroSection images={HERO_IMAGES} />;

export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/tours/catalog" element={<ToursCatalogPage />} />
        <Route path="/tours/:id" element={<TourDetailPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/destinations/mondulkiri" element={<DestinationDetail />} />
        <Route path="/available_tours" element={<AvailableTours />} />
        <Route path="/top_attraction" element={<TopAttractions />} />
        <Route path="/herosection" element={heroSection} />
        <Route path="/practical_section" element={<TravelSection />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/signup" element={<RegisterForm />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/tourpackages" element={<FeaturedTourPackages />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/detail-content" element={<ToursDetailContent />} />
        
        <Route element={<RequireAuth />}>
          <Route element={<RequirePermission {...ROUTE_ACCESS["/dashboard"]} />}>
            <Route element={<Sidebar />}>
              <Route path="/sidebar" element={<DashboardEntry />} />
              <Route path="/dashboard" element={<DashboardEntry />} />
            </Route>
          </Route>

          <Route element={<RequirePermission {...ROUTE_ACCESS["/overview"]} />}>
            <Route element={<Sidebar />}>
              <Route path="/overview" element={<RevenueOverview />} />
            </Route>
          </Route>

          <Route element={<RequirePermission {...ROUTE_ACCESS["/popular"]} />}>
            <Route element={<Sidebar />}>
              <Route path="/popular" element={<PopularDestinations />} />
              <Route path="/tour-light" element={<TourLight />} />
              <Route path="/authentic-khmer" element={<AuthenticKhmer />} />
            </Route>
          </Route>

          <Route element={<RequirePermission {...ROUTE_ACCESS["/bookings"]} />}>
            <Route element={<Sidebar />}>
              <Route path="/listbooking" element={<BookingList />} />
              <Route path="/bookings" element={<BookingList />} />
            </Route>
          </Route>

          <Route
            element={
              <RequirePermission {...ROUTE_ACCESS["/table_destinations"]} />
            }
          >
            <Route element={<Sidebar />}>
              <Route path="/table_destinations" element={<DestinationsList />} />
              <Route path="/admin/destinations" element={<DestinationsList />} />
            </Route>
          </Route>

          <Route element={<RequirePermission {...ROUTE_ACCESS["/destination"]} />}>
            <Route element={<Sidebar />}>
              <Route path="/destination" element={<DestinationForm />} />
            </Route>
          </Route>

          <Route element={<RequirePermission {...ROUTE_ACCESS["/admin/tours"]} />}>
            <Route element={<Sidebar />}>
              <Route path="/admin/tours" element={<TourListPage />} />
            </Route>
          </Route>

          <Route element={<RequirePermission {...ROUTE_ACCESS["/guides"]} />}>
            <Route element={<Sidebar />}>
              <Route path="/guides" element={<GuidesList />} />
            </Route>
          </Route>

          <Route element={<RequirePermission adminOnly />}>
            <Route element={<Sidebar />}>
              <Route path="/customer" element={<Customers />} />
              <Route path="/createcustomer" element={<CreateCustomer />} />
              <Route path="/create-user" element={<CreateUsers />} />
              <Route path="/users" element={<PageListUser />} />
              <Route path="/customers" element={<Customers />} />
            </Route>
          </Route>

          <Route element={<RequirePermission {...ROUTE_ACCESS["/settings"]} />}>
            <Route element={<Sidebar />}>
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/experience_detail" element={<ExperienceDetail />} />
      </Routes>
    </>
  );
}
