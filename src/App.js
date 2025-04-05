import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';

// Auth Provider
import { AuthProvider } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { MessagingProvider } from './contexts/MessagingContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ListingDetailPage from './pages/ListingDetailPage';
import CreateListingPage from './pages/CreateListingPage';
import EditListingPage from './pages/EditListingPage';
import SearchResultsPage from './pages/SearchResultsPage';
import SavedListingsPage from './pages/SavedListingsPage';
import NotificationsPage from './pages/NotificationsPage';
import OffersPage from './pages/OffersPage';
import MessagesPage from './pages/MessagesPage';
import MessageThreadPage from './pages/MessageThreadPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ConfirmResetPage from './pages/ConfirmResetPage';
import NotFoundPage from './pages/NotFoundPage';
import SafetyTipsPage from './pages/SafetyTipsPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ContactUsPage from './pages/ContactUsPage';
import TermsOfUsePage from './pages/TermsOfUsePage';
import UserProfilePage from './pages/UserProfilePage';
import UserListingsPage from './pages/UserListingsPage';
import ReviewPurchasePage from './pages/ReviewPurchasePage';
import MyReportsPage from './pages/MyReportsPage';
import TestMessagingPage from './pages/TestMessagingPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ListingManagement from './pages/admin/ListingManagement';
import ReportsManagement from './pages/admin/ReportsManagement';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import RunMigrations from './pages/admin/RunMigrations';
import AuditLogGuide from './pages/admin/AuditLogGuide';
import AuditAnalytics from './pages/admin/AuditAnalytics';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import ListingManagementGuide from './pages/admin/AdminGuides/ListingManagementGuide';
import AdminDeletionGuide from './pages/admin/AdminGuides/AdminDeletionGuide';
import ContactMessages from './pages/admin/ContactMessages';
import ListingPromotionApprovals from './pages/admin/ListingPromotionApprovals';
import StorageDiagnostics from './pages/admin/StorageDiagnostics';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import NotificationHandler from './components/NotificationHandler';
import HeaderLayout from './components/HeaderLayout';
import AdminLayout from './components/AdminLayout';
import ScrollToTop from './components/ScrollToTop';

// Add ReportForm to the imports
import ReportForm from './pages/ReportForm';

const App = () => {
  return (
    <>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        autoHideDuration={4000}
        preventDuplicate
        dense
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        }}
      >
        <AuthProvider>
          <NotificationsProvider>
            <MessagingProvider>
              <Router>
                <ScrollToTop />
                <NotificationHandler />
                <Routes>
                  {/* Admin Routes - No Header/Footer */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="listings" element={<ListingManagement />} />
                      <Route path="reports" element={<AdminReports />} />
                      <Route path="messages" element={<ContactMessages />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="audit-log" element={<AdminAuditLog />} />
                      <Route path="audit-log/guide" element={<AuditLogGuide />} />
                      <Route path="audit-log/analytics" element={<AuditAnalytics />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="run-migrations" element={<RunMigrations />} />
                      <Route path="listings/guide" element={<ListingManagementGuide />} />
                      <Route path="deletion-guide" element={<AdminDeletionGuide />} />
                      <Route path="promotion-approvals" element={<ListingPromotionApprovals />} />
                      <Route path="storage-diagnostics" element={<StorageDiagnostics />} />
                    </Route>
                  </Route>
                  
                  {/* Regular Routes - With Header/Footer */}
                  <Route path="/" element={<HeaderLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="login" element={<LoginPage />} />
                    <Route path="register" element={<RegisterPage />} />
                    <Route path="forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="reset-password" element={<ConfirmResetPage />} />
                    <Route path="listings/:id" element={<ListingDetailPage />} />
                    <Route path="search" element={<SearchResultsPage />} />
                    
                    {/* Information Pages */}
                    <Route path="safety-tips" element={<SafetyTipsPage />} />
                    <Route path="help-center" element={<HelpCenterPage />} />
                    <Route path="contact-us" element={<ContactUsPage />} />
                    <Route path="terms-of-use" element={<TermsOfUsePage />} />
                    
                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="create-listing" element={<CreateListingPage />} />
                      <Route path="edit-listing/:id" element={<EditListingPage />} />
                      <Route path="saved-listings" element={<SavedListingsPage />} />
                      <Route path="listings" element={<UserListingsPage />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="offers" element={<OffersPage />} />
                      <Route path="review-purchase/:offerId" element={<ReviewPurchasePage />} />
                      <Route path="messages" element={<MessagesPage />} />
                      <Route path="messages/:id" element={<MessageThreadPage />} />
                      <Route path="report" element={<ReportForm />} />
                      <Route path="my-reports" element={<MyReportsPage />} />
                      <Route path="user/:userId" element={<UserProfilePage />} />
                      <Route path="test-messaging" element={<TestMessagingPage />} />
                    </Route>
                    
                    {/* 404 Route */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </Router>
            </MessagingProvider>
          </NotificationsProvider>
        </AuthProvider>
      </SnackbarProvider>
    </>
  );
};

export default App; 