import { create } from 'zustand'
import api from '../utils/api'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true })
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.access_token)
    set({ user: res.data.user, token: res.data.access_token, isLoading: false })
    return res.data
  },

  register: async (data) => {
    set({ isLoading: true })
    const res = await api.post('/auth/register', data)
    localStorage.setItem('token', res.data.access_token)
    set({ user: res.data.user, token: res.data.access_token, isLoading: false })
    return res.data
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },

  updateProfile: async (data) => {
    const res = await api.put('/auth/me', data)
    set({ user: res.data })
    return res.data
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
