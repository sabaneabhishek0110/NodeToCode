import { create } from 'zustand'
import axios from 'axios'

const API = 'http://localhost:8080/api/projects'

const useProjectStore = create((set, get) => ({
  projects: [],
  projectsById: {},
  loading: false,
  error: null,

  fetchProject: async (id) => {
    const cached = get().projectsById[String(id)]
    if (cached) return cached
    set({ loading: true, error: null })
    try {
      const res = await axios.get(`${API}/${id}`)
      const project = res.data
      set((state) => ({
        projectsById: { ...state.projectsById, [String(id)]: project },
        loading: false,
      }))
      return project
    } catch (err) {
      console.error('fetchProject error', err)
      set({ error: err.response?.data?.message || err.message, loading: false })
      return null
    }
  },

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const res = await axios.get(API)
      const data = Array.isArray(res.data) ? res.data : Object.values(res.data || {})
      set({ projects: data, loading: false })
    } catch (err) {
      console.error('fetchProjects error', err)
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  createProject: async ({ title, description, language }) => {
    set({ loading: true, error: null })
    try {
      const payload = {
        title,
        description: description || '',
        language: language || 'JAVA',
      }
      console.log('Creating project with payload:', payload)
      const res = await axios.post(API, payload)
      console.log('Create project response:', res.data)
      set((state) => ({
        projects: [...state.projects, res.data],
        loading: false,
      }))
      return res.data
    } catch (err) {
      console.error('createProject error', err.response?.status, err.response?.data || err.message)
      set({ error: err.response?.data?.message || err.response?.data || err.message, loading: false })
      return null
    }
  },

  deleteProject: async (id) => {
    try {
      await axios.delete(`${API}/${id}`)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }))
    } catch (err) {
      console.error('deleteProject error', err)
      set({ error: err.response?.data?.message || err.message })
    }
  },

  saveCode: async (projectId, code) => {
    try {
      await axios.patch(`${API}/${projectId}/code`, { code })
      return { ok: true }
    } catch (err) {
      console.error('saveCode error', err)
      return { ok: false, error: err.response?.data?.message || err.message }
    }
  },

  saveGeneratedPrompt: async (projectId, prompt) => {
    try {
      await axios.patch(`${API}/${projectId}/prompt`, { prompt })
      return { ok: true }
    } catch (err) {
      console.error('saveGeneratedPrompt error', err)
      return { ok: false, error: err.response?.data?.message || err.message }
    }
  },
}))

export default useProjectStore
