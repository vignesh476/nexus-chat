import React, { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { UserProfileProvider } from './context/UserProfileContext';
import { ThemeProvider as MuiThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { MoodProvider } from './context/MoodContext';
import { CallProvider } from './context/CallContext';
import GlobalCallNotification from './components/GlobalCallNotification';



import {NotificationProvider} from './context/NotificationContext'
// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const RoomListPage = lazy(() => import('./pages/RoomListPage'));
const ChatRoomPage = lazy(() => import('./pages/ChatRoomPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const CallHistoryPage = lazy(() => import('./pages/CallHistoryPage'));



const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    Loading...
  </div>
);

// Simple error boundary for production stability
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error('[ErrorBoundary]', err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>Please refresh the page. If the issue persists, contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/rooms" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/rooms" /> : <RegisterPage />}
        />
        <Route
          path="/rooms"
          element={user ? <RoomListPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/chat/:roomId"
          element={user ? <ChatRoomPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile/:username"
          element={user ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/notifications"
          element={user ? <NotificationsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/calls"
          element={user ? <CallHistoryPage /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={user ? "/rooms" : "/login"} />} />
      </Routes>
    </Suspense>
  );
};


function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
function AppContent() {
  const { darkMode } = useTheme();

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  }), [darkMode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <SocketProvider>
        <UserProfileProvider>
          <MoodProvider>
            <CallProvider>
              <NotificationProvider>
                <Router>
                  <ErrorBoundary>
                    <AppRoutes />
                  </ErrorBoundary>
                  <GlobalCallNotification />  {/* ✅ KEEP THIS ONE */}
                </Router>
              </NotificationProvider>
            </CallProvider>
          </MoodProvider>
        </UserProfileProvider>
      </SocketProvider>
    </MuiThemeProvider>
  );
}


export default App;
