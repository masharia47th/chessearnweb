import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div style={{textAlign:"center"}}>Loading...</div>
  return isAuthenticated ? children : <Navigate to="/login" replace />
}
export default ProtectedRoute