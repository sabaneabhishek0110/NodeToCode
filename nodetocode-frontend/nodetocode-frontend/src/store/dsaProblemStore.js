import { create } from 'zustand'
import axios from 'axios'

const API_BASE = 'http://localhost:8080/api/dsa-problems'

const useDSAProblemStore = create((set, get) => ({
  dsaProblemsList: [],
  dsaProblemsById: {},
  loading: false,
  error: null,

  fetchDSAProblems: async () => {
    set({ loading: true, error: null })
    try {
      const response = await axios.get(API_BASE)
      const data = Array.isArray(response.data) ? response.data : Object.values(response.data || {})
      const byId = {}
      data.forEach((p) => { byId[String(p.id)] = p })
      set({ dsaProblemsList: data, dsaProblemsById: byId, loading: false })
      return data
    } catch (err) {
      set({ error: err.response?.data?.message || err.message || 'Failed to fetch DSA problems', loading: false })
      return []
    }
  },

  fetchDSAProblem: async (id) => {
    if (!id) return null
    set({ loading: true, error: null })
    try {
      const response = await axios.get(`${API_BASE}/${id}`)
      const problem = response.data
      set((state) => ({
        dsaProblemsById: { ...state.dsaProblemsById, [String(id)]: problem },
        loading: false
      }))
      return problem
    } catch (err) {
      set({ error: err.response?.data?.message || err.message || 'Failed to fetch DSA problem', loading: false })
      return null
    }
  },

  createDSAProblem: async (payload) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.post(API_BASE, payload)
      const problem = response.data
      set((state) => ({
        dsaProblemsList: [...state.dsaProblemsList, problem],
        dsaProblemsById: { ...state.dsaProblemsById, [String(problem.id)]: problem },
        loading: false
      }))
      return problem
    } catch (err) {
      set({ error: err.response?.data?.message || err.message || 'Failed to create DSA problem', loading: false })
      return null
    }
  },

  clearError: () => set({ error: null }),
}))

export default useDSAProblemStore
