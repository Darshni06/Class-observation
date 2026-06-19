import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../firebase/services'
import { getUserProfile } from '../firebase/services'
import { useToast } from '../contexts/ToastContext'

export default function LoginPage() {
  const [role, setRole] = useState('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const friendlyError = (code) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.'
      default:
        return 'Could not sign in. Please try again.'
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const cred = await loginUser(email.trim(), password)
      const profile = await getUserProfile(cred.user.uid)

      if (!profile) {
        toast.error('No portal profile found for this account. Contact your admin.')
        setLoading(false)
        return
      }
      if (profile.role !== role) {
        toast.error(`This account is registered as ${profile.role === 'admin' ? 'an Admin' : 'a Teacher'}. Switch tabs and try again.`)
        setLoading(false)
        return
      }
      toast.success(`Welcome back, ${profile.name?.split(' ')[0] || ''}!`)
      navigate(profile.role === 'admin' ? '/admin' : '/teacher')
    } catch (err) {
      toast.error(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-mark">
            <img src="/assets/logo/logo.png" alt="Kamala Niketan logo" />
          </div>
          <h1>Kamala Niketan<br />Class Observation Portal</h1>
          <p>
            A shared space for classroom observations, structured feedback, and AI-assisted
            reports — helping every Montessori classroom grow with clarity and care.
          </p>
        </div>
      </div>

      <div className="login-right">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <p className="sub">Choose your role and enter your credentials to continue.</p>

          <div className="role-grid">
            <div className={`role-card ${role === 'admin' ? 'selected' : ''}`} onClick={() => setRole('admin')}>
              <i className="ti ti-shield-check" />
              <span>Admin</span>
              <small>Observations & reports</small>
            </div>
            <div className={`role-card ${role === 'teacher' ? 'selected' : ''}`} onClick={() => setRole('teacher')}>
              <i className="ti ti-user-check" />
              <span>Teacher</span>
              <small>My feedback & progress</small>
            </div>
          </div>

          <div className="form-field">
            <label>Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@kamalaniketan.edu"
              autoComplete="username"
            />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button className="btn-login" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : <>Sign in <i className="ti ti-arrow-right" /></>}
          </button>
        </form>
      </div>
    </div>
  )
}
