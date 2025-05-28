import './AuthForms.css'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function SignupForm() {
  const { signup, loading } = useAuth()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', username: '', phone_number: '', password: ''
  })
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setMessage('')
    const res = await signup(form)
    setMessage(res.message)
    if (res.success) {
      setTimeout(() => {
        navigate('/login')
      }, 1200) // Show message briefly, then redirect
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Sign Up</h2>
      <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" required />
      <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" required />
      <input name="username" value={form.username} onChange={handleChange} placeholder="Username" required />
      <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="Phone Number" required />
      <input name="password" value={form.password} onChange={handleChange} placeholder="Password" type="password" required />
      <button type="submit" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</button>
      {message && <div className="auth-message">{message}</div>}
    </form>
  )
}

export default SignupForm