import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import SignupForm from './components/SignupForm';
import LoginForm from './components/LoginForm';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Profile from "./pages/Profile";


function Dashboard() {
  const { user, logout } = useAuth()
  return (
    <div style={{padding: "2rem"}}>
      <h2>Welcome, {user?.first_name || user?.username}!</h2>
      <p>Your email: {user?.email}</p>
      <button onClick={logout} style={{marginTop: "1rem"}}>Logout</button>
    </div>
  )
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
      </Routes>
    </Router>
  )
}

export default App