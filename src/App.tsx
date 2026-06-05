import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AuthCallbackPage from "./auth/AuthCallbackPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import ResourcePage from "./pages/ResourcePage";
import DocsPage from "./pages/DocsPage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import OverviewPage from "./pages/dashboard/OverviewPage";
import VoicePage from "./pages/dashboard/VoicePage";
import InstantVoiceCloningPage from "./pages/dashboard/InstantVoiceCloningPage";
import UsagePage from "./pages/dashboard/UsagePage";
import HistoryPage from "./pages/dashboard/HistoryPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import SubscriptionPage from "./pages/dashboard/SubscriptionPage";
import SelectPlanPage from "./pages/dashboard/SelectPlanPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import OrganizationPage from "./pages/dashboard/OrganizationPage";

function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-ink-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-radial-field opacity-90" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      <Header />
      {children}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MarketingLayout><LandingPage /></MarketingLayout>} />
          <Route path="/docs" element={<MarketingLayout><DocsPage /></MarketingLayout>} />
          <Route path="/pricing" element={<MarketingLayout><PricingPage /></MarketingLayout>} />
          <Route path="/contact" element={<MarketingLayout><ContactPage /></MarketingLayout>} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/:page" element={<MarketingLayout><ResourcePage /></MarketingLayout>} />
          <Route
            path="/dashboard/select-plan"
            element={
              <ProtectedRoute>
                <SelectPlanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="voice" element={<VoicePage />} />
            <Route path="voice-clone" element={<InstantVoiceCloningPage />} />
            <Route path="usage" element={<UsagePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="organization" element={<OrganizationPage />} />
          </Route>
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
