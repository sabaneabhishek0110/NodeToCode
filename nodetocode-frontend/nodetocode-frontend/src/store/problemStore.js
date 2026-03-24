import { create } from 'zustand'
import axios from 'axios'

const API_BASE = 'http://localhost:8080/api/problems'

const useProblemStore = create((set, get) => ({
  problemsList: [],
  problemsById: {},
  loading: false,
  error: null,

  // GET /api/problems - Get all problems
  fetchProblems: async () => {
    set({ loading: true, error: null })
    try {
      const response = await axios.get(API_BASE)
      console.log("Problems" + response.data)
      // Convert to array in case backend returns array-like object
      const data = Array.isArray(response.data) ? response.data : Object.values(response.data || {})
      const byId = {}
      data.forEach((p) => { byId[String(p.id)] = p })
      set({ problemsList: data, problemsById: byId, loading: false })
      return data
    } catch (err) {
      console.log("Error in fetching problems")
      set({ error: err.response?.data?.message || err.message || 'Failed to fetch problems', loading: false })
      return []
    }
  },

  // GET /api/problems/{id} - Get problem by id
  fetchProblem: async (id) => {
    if (!id) return null
    set({ loading: true, error: null })
    try {
      const response = await axios.get(`${API_BASE}/${id}`)
      const problem = response.data
      set((state) => ({ 
        problemsById: { ...state.problemsById, [String(id)]: problem }, 
        loading: false 
      }))
      return problem
    } catch (err) {
      console.log("Error in fetching problem")
      set({ error: err.response?.data?.message || err.message || 'Failed to fetch problem', loading: false })
      return null
    }
  },

  // POST /api/problems - Create a new problem
  createProblem: async (payload) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.post(API_BASE, payload)
      const problem = response.data
      set((state) => ({ 
        problemsList: [...state.problemsList, problem], 
        problemsById: { ...state.problemsById, [String(problem.id)]: problem }, 
        loading: false 
      }))
      return problem
    } catch (err) {
      console.log("Error in create problem")
      set({ error: err.response?.data?.message || err.message || 'Failed to create problem', loading: false })
      return null
    }
  },

  // PUT /api/problems/{id} - Update a problem
  updateProblem: async (id, payload) => {
    if (!id) return null
    set({ loading: true, error: null })
    try {
      const response = await axios.put(`${API_BASE}/${id}`, payload)
      const problem = response.data
      set((state) => ({
        problemsList: state.problemsList.map(p => p.id === id ? problem : p),
        problemsById: { ...state.problemsById, [String(id)]: problem },
        loading: false
      }))
      return problem
    } catch (err) {
      console.log("Error in update problem")
      set({ error: err.response?.data?.message || err.message || 'Failed to update problem', loading: false })
      return null
    }
  },

  // DELETE /api/problems/{id} - Delete a problem
  deleteProblem: async (id) => {
    if (!id) return false
    set({ loading: true, error: null })
    try {
      await axios.delete(`${API_BASE}/${id}`)
      set((state) => {
        const newById = { ...state.problemsById }
        delete newById[String(id)]
        return {
          problemsList: state.problemsList.filter(p => p.id !== id),
          problemsById: newById,
          loading: false
        }
      })
      return true
    } catch (err) {
      console.log("Error in delete problem")
      set({ error: err.response?.data?.message || err.message || 'Failed to delete problem', loading: false })
      return false
    }
  },

  // GET /api/problems/difficulty/{difficulty} - Get problems by difficulty
  fetchProblemsByDifficulty: async (difficulty) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.get(`${API_BASE}/difficulty/${difficulty}`)
      const data = Array.isArray(response.data) ? response.data : Object.values(response.data || {})
      set({ loading: false })
      return data
    } catch (err) {
      console.log("Error in fetching problem by difficulty")
      set({ error: err.response?.data?.message || err.message || 'Failed to fetch problems by difficulty', loading: false })
      return []
    }
  },

  // GET /api/problems/search?keyword={keyword} - Search problems by title
  searchProblems: async (keyword) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.get(`${API_BASE}/search`, {
        params: { keyword }
      })
      const data = Array.isArray(response.data) ? response.data : Object.values(response.data || {})
      set({ loading: false })
      return data
    } catch (err) {
      console.log("Error in search problem")
      set({ error: err.response?.data?.message || err.message || 'Failed to search problems', loading: false })
      return []
    }
  },

  clearError: () => set({ error: null }),
}))

export default useProblemStore
