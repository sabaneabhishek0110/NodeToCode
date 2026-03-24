import { create } from 'zustand'
import axios from 'axios'

// Axios default: include credentials so browser accepts HttpOnly cookie from backend
axios.defaults.withCredentials = true

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  initialized: false,

  // Called after Google OAuth response; backend returns user + token
  loginWithGoogle: async (credentialResponse) => {
    const credential = credentialResponse?.credential || null
    if (!credential) {
      set({ error: 'No credential provided' })
      return
    }
    set({ loading: true, error: null })
    try {
      const res = await axios.post('http://localhost:8080/api/users/oauth/google', { token: credential })
      const { token, ...user } = res.data || {}
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        localStorage.setItem('token', token)
      }
      set({ user: Object.keys(user).length ? user : res.data, token, loading: false })
    } catch (err) {
      console.error('Auth login error', err)
      set({ error: err?.response?.data || err.message || 'Login failed', loading: false })
    }
  },

  // Guest login: backend returns user + token
  guestLogin: async () => {
    set({ loading: true, error: null })
    try {
      const res = await axios.post('http://localhost:8080/api/users/guest')
      const { token, ...user } = res.data || {}
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        localStorage.setItem('token', token)
      }
      set({ user: Object.keys(user).length ? user : res.data, token, loading: false })
    } catch (err) {
      console.error('Guest login error', err)
      set({ error: err?.response?.data || err.message || 'Guest login failed', loading: false })
    }
  },

  // Restore session on app start by probing /api/users/me
  // Auth is cookie-based (HttpOnly jwt cookie), so we just call the endpoint
  restoreToken: async () => {
    if (get().initialized) return
    set({ loading: true })
    try {
      const res = await axios.get('http://localhost:8080/api/users/me')
      const user = res.data || null
      set({ user, loading: false, initialized: true })
    } catch {
      // Cookie expired or invalid — user is not authenticated
      set({ user: null, token: null, loading: false, initialized: true })
    }
  },

  // Fetch current user using stored token
  fetchCurrentUser: async () => {
    set({ loading: true, error: null })
    try {
      const res = await axios.get('http://localhost:8080/api/users/me')
      const user = res.data || null
      set({ user, loading: false })
    } catch (err) {
      // not authenticated or error
      set({ user: null, loading: false })
    }
  },

  logout: async () => {
    try {
      await axios.post('http://localhost:8080/api/users/logout')
    } catch (e) {
      // ignore
    }
    delete axios.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  // ── AI API Key Settings ──

  getApiKeyStatus: async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/users/settings/api-key')
      return res.data // { hasApiKey, maskedKey }
    } catch {
      return { hasApiKey: false, maskedKey: '' }
    }
  },

  updateApiKey: async (apiKey) => {
    try {
      await axios.put('http://localhost:8080/api/users/settings/api-key', { apiKey })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || err.message }
    }
  },

  removeApiKey: async () => {
    try {
      await axios.delete('http://localhost:8080/api/users/settings/api-key')
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.response?.data?.error || err.message }
    }
  },
}))

export default useAuthStore
