import './AuthForms.css'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function LoginForm() {
  const { login, loading } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setMessage('')
    const res = await login(identifier, password)
    setMessage(res.message)
    if (res.success) navigate("/dashboard")
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Email, Username or Phone" required />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" required />
      <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
      {message && <div className="auth-message">{message}</div>}
    </form>
  )
}

export default LoginForm