import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignupForm from './components/SignupForm';
import LoginForm from './components/LoginForm';
import GameCreate from './components/GameCreate';
import GameList from './components/GameList'; // New
import Game from './pages/Game';
// import GameHistory from './pages/GameHistory';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Welcome, {user?.first_name || user?.username}!</h2>
      <p>Your email: {user?.email}</p>
      <button onClick={logout} style={{ marginTop: '1rem' }}>
        Logout
      </button>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-game"
          element={
            <ProtectedRoute>
              <GameCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game-list"
          element={
            <ProtectedRoute>
              <GameList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:gameId"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />
        {/* <Route
          path="/history"
          element={
            <ProtectedRoute>
              <GameHistory />
            </ProtectedRoute>
          }
        /> */}
      </Routes>
    </Router>
  );
}

export default App;