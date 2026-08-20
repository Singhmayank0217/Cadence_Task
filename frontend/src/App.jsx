import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui'
import { DashboardPage } from '@/pages/DashboardPage'
import { DirectoryPage } from '@/pages/DirectoryPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'
import { TasksPage } from '@/pages/TasksPage'
import { TeamPage } from '@/pages/TeamPage'

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <Spinner className="h-6 w-6" />
    </div>
  )
}

/** Guards every app route; remembers where you were headed before signing in. */
function RequireAuth({ children }) {
  const { isAuthenticated, initialising } = useAuth()
  const location = useLocation()

  if (initialising) return <FullPageSpinner />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <AppShell>{children}</AppShell>
}

function PublicOnly({ children }) {
  const { isAuthenticated, initialising } = useAuth()
  if (initialising) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/tasks"
            element={
              <RequireAuth>
                <TasksPage />
              </RequireAuth>
            }
          />
          <Route
            path="/tasks/:taskId"
            element={
              <RequireAuth>
                <TaskDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/team"
            element={
              <RequireAuth>
                <TeamPage />
              </RequireAuth>
            }
          />
          <Route
            path="/directory"
            element={
              <RequireAuth>
                <DirectoryPage />
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              <RequireAuth>
                <NotFoundPage />
              </RequireAuth>
            }
          />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
