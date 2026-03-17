import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const WelcomePage = lazy(() => import('@/features/onboarding/pages/WelcomePage'))
const CreateBoatPage = lazy(() => import('@/features/onboarding/pages/CreateBoatPage'))
const JoinBoatPage = lazy(() => import('@/features/onboarding/pages/JoinBoatPage'))
const SwitchBoatPage = lazy(() => import('@/features/onboarding/pages/SwitchBoatPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const BookingsPage = lazy(() => import('@/features/bookings/pages/BookingsPage'))
const BookingNewPage = lazy(() => import('@/features/bookings/pages/BookingNewPage'))
const BookingDetailPage = lazy(() => import('@/features/bookings/pages/BookingDetailPage'))
const CreditsPage = lazy(() => import('@/features/credits/pages/CreditsPage'))
const FinancePage = lazy(() => import('@/features/finance/pages/FinancePage'))
const ChargesPage = lazy(() => import('@/features/finance/pages/ChargesPage'))
const InvoicesPage = lazy(() => import('@/features/finance/pages/InvoicesPage'))
const PaymentsPage = lazy(() => import('@/features/finance/pages/PaymentsPage'))
const MaintenancePage = lazy(() => import('@/features/maintenance/pages/MaintenancePage'))
const MaintenanceNewPage = lazy(() => import('@/features/maintenance/pages/MaintenanceNewPage'))
const MaintenanceDetailPage = lazy(() => import('@/features/maintenance/pages/MaintenanceDetailPage'))
const AnnouncementsPage = lazy(() => import('@/features/announcements/pages/AnnouncementsPage'))
const ChecklistsPage = lazy(() => import('@/features/checklists/pages/ChecklistsPage'))
const ChecklistDetailPage = lazy(() => import('@/features/checklists/pages/ChecklistDetailPage'))
const ContactsPage = lazy(() => import('@/features/contacts/pages/ContactsPage'))
const FeedbackPage = lazy(() => import('@/features/feedback/pages/FeedbackPage'))
const FeedbackNewPage = lazy(() => import('@/features/feedback/pages/FeedbackNewPage'))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'))
const PartnersPage = lazy(() => import('@/features/partners/pages/PartnersPage'))
const PartnerDetailPage = lazy(() => import('@/features/partners/pages/PartnerDetailPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))
const CreditsSettingsPage = lazy(() => import('@/features/settings/pages/CreditsSettingsPage'))
const NotificationsSettingsPage = lazy(() => import('@/features/settings/pages/NotificationsSettingsPage'))
const WeatherSettingsPage = lazy(() => import('@/features/settings/pages/WeatherSettingsPage'))
const AuditPage = lazy(() => import('@/features/audit/pages/AuditPage'))
const BackupsPage = lazy(() => import('@/features/backups/pages/BackupsPage'))

// Guards
import AuthGuard from './guards/AuthGuard'
import BoatGuard from './guards/BoatGuard'
import RoleGuard from './guards/RoleGuard'
import AppLayout from '@/components/layout/AppLayout'

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/join/:token',
    element: (
      <SuspenseWrapper>
        <JoinBoatPage />
      </SuspenseWrapper>
    ),
  },
  // Auth-required routes without boat requirement
  {
    element: <AuthGuard />,
    children: [
      {
        path: '/welcome',
        element: (
          <SuspenseWrapper>
            <WelcomePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/create-boat',
        element: (
          <SuspenseWrapper>
            <CreateBoatPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/switch-boat',
        element: (
          <SuspenseWrapper>
            <SwitchBoatPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  // Auth + boat required — wrapped in AppLayout
  {
    element: (
      <AuthGuard>
        <BoatGuard>
          <AppLayout />
        </BoatGuard>
      </AuthGuard>
    ),
    children: [
      {
        path: '/dashboard',
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/bookings',
        element: (
          <SuspenseWrapper>
            <BookingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/bookings/new',
        element: (
          <SuspenseWrapper>
            <BookingNewPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/bookings/:id',
        element: (
          <SuspenseWrapper>
            <BookingDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/credits',
        element: (
          <SuspenseWrapper>
            <CreditsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/finance',
        element: (
          <SuspenseWrapper>
            <FinancePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/finance/charges',
        element: (
          <RoleGuard roles={['treasurer', 'admin']}>
            <SuspenseWrapper>
              <ChargesPage />
            </SuspenseWrapper>
          </RoleGuard>
        ),
      },
      {
        path: '/finance/invoices',
        element: (
          <SuspenseWrapper>
            <InvoicesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/finance/payments',
        element: (
          <RoleGuard roles={['treasurer', 'admin']}>
            <SuspenseWrapper>
              <PaymentsPage />
            </SuspenseWrapper>
          </RoleGuard>
        ),
      },
      {
        path: '/maintenance',
        element: (
          <SuspenseWrapper>
            <MaintenancePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/maintenance/new',
        element: (
          <SuspenseWrapper>
            <MaintenanceNewPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/maintenance/:id',
        element: (
          <SuspenseWrapper>
            <MaintenanceDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/announcements',
        element: (
          <SuspenseWrapper>
            <AnnouncementsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/checklists',
        element: (
          <SuspenseWrapper>
            <ChecklistsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/checklists/:id',
        element: (
          <SuspenseWrapper>
            <ChecklistDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/contacts',
        element: (
          <SuspenseWrapper>
            <ContactsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/feedback',
        element: (
          <SuspenseWrapper>
            <FeedbackPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/feedback/new',
        element: (
          <SuspenseWrapper>
            <FeedbackNewPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/profile',
        element: (
          <SuspenseWrapper>
            <ProfilePage />
          </SuspenseWrapper>
        ),
      },
      // Admin-only routes
      {
        path: '/partners',
        element: (
          <RoleGuard roles={['admin']}>
            <SuspenseWrapper>
              <PartnersPage />
            </SuspenseWrapper>
          </RoleGuard>
        ),
      },
      {
        path: '/partners/:id',
        element: (
          <RoleGuard roles={['admin']}>
            <SuspenseWrapper>
              <PartnerDetailPage />
            </SuspenseWrapper>
          </RoleGuard>
        ),
      },
      {
        path: '/settings',
        element: (
          <RoleGuard roles={['admin']}>
            <SuspenseWrapper>
              <SettingsPage />
            </SuspenseWrapper>
          </RoleGuard>
        ),
      },
      {
        path: '/settings/credits',
        element: (
          <RoleGuard roles={['admin']}>
            <SuspenseWrapper>
              <CreditsSettingsPage />
            </SuspenseWrapper>
          </RoleGuard>
        ),
      },
      {
        path: '/settings/notifications',
        element: (
          <RoleGuard roles={['admin']}>
            <SuspenseWrapper>
              <NotificationsSettingsPage />
            </SuspenseWrapper>
          </RoleGuard>
        ),
      },
      {
        path: '/settings/weather',
        element: (
          <RoleGuard roles={['admin']}>
            <SuspenseWrapper>
              <WeatherSettingsPage />
            </SuspenseWrapper>
          </RoleGuard>
        ),
      },
      {
        path: '/audit',
        element: (
          <RoleGuard roles={['admin']}>
            <SuspenseWrapper>
              <AuditPage />
            </SuspenseWrapper>
          </RoleGuard>
        ),
      },
      {
        path: '/backups',
        element: (
          <RoleGuard roles={['admin']}>
            <SuspenseWrapper>
              <BackupsPage />
            </SuspenseWrapper>
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
