import { create } from 'zustand'
import axios from 'axios'

const API = 'http://localhost:8080/api/projects'
const PROBLEM_API = 'http://localhost:8080/api/problems'

// Shared helper — serialises a React-Flow toObject() result into the backend GraphDTO shape
const toGraphPayload = (flowObject) => {
  const { nodes = [], edges = [], viewport = {} } = flowObject || {}
  const nodePayload = nodes.map((n) => ({
    reactFlowId: n.id,
    type: n.type,
    positionX: n.position.x,
    positionY: n.position.y,
    prompt: n.data?.prompt || '',
    metadata: JSON.stringify({ ...n.data, onUpdate: undefined, onDelete: undefined }),
  }))
  const edgePayload = edges.map((e) => ({
    reactFlowId: e.id,
    sourceReactFlowId: e.source,
    targetReactFlowId: e.target,
    metadata: JSON.stringify({
      type: e.type,
      data: { ...(e.data || {}), onDelete: undefined },
      markerEnd: e.markerEnd,
      style: e.style,
      animated: e.animated,
    }),
  }))
  return {
    nodes: nodePayload,
    edges: edgePayload,
    viewportX: viewport.x ?? 0,
    viewportY: viewport.y ?? 0,
    viewportZoom: viewport.zoom ?? 1,
  }
}

const useGraphStore = create((set) => ({
  // keyed by projectId — caches last loaded graph
  graphsByProjectId: {},
  loading: false,
  saving: false,
  generating: false,
  error: null,

  // GET /api/projects/{projectId}/graph
  loadGraph: async (projectId) => {
    console.log('[graphStore] loadGraph called, projectId=', projectId)
    set({ loading: true, error: null })
    try {
      const res = await axios.get(`${API}/${projectId}/graph`, { withCredentials: true })
      const graph = res.data // { nodes, edges, generatedPrompt, viewportX, viewportY, viewportZoom }
      console.log('[graphStore] loadGraph success:', graph.nodes?.length, 'nodes,', graph.edges?.length, 'edges')
      set((state) => ({
        graphsByProjectId: { ...state.graphsByProjectId, [String(projectId)]: graph },
        loading: false,
      }))
      return { ok: true, data: graph }
    } catch (err) {
      console.error('[graphStore] loadGraph FAILED — status:', err.response?.status, 'data:', err.response?.data, 'message:', err.message)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message
      set({ loading: false, error: errorMsg })
      return { ok: false, error: errorMsg }
    }
  },

  // PUT /api/projects/{projectId}/graph — uses rfInstance.toObject() data
  saveGraph: async (projectId, flowObject) => {
    const { nodes = [], edges = [], viewport = {} } = flowObject
    console.log('[graphStore] saveGraph called, projectId=', projectId, 'nodes=', nodes.length, 'edges=', edges.length, 'viewport=', viewport)
    set({ saving: true, error: null })
    try {
      const nodePayload = nodes.map((n) => ({
        reactFlowId: n.id,
        type: n.type,
        positionX: n.position.x,
        positionY: n.position.y,
        prompt: n.data?.prompt || '',
        metadata: JSON.stringify({ ...n.data, onUpdate: undefined, onDelete: undefined }),
      }))
      const edgePayload = edges.map((e) => ({
        reactFlowId: e.id,
        sourceReactFlowId: e.source,
        targetReactFlowId: e.target,
        metadata: JSON.stringify({
          type: e.type,
          data: { ...(e.data || {}), onDelete: undefined },
          markerEnd: e.markerEnd,
          style: e.style,
          animated: e.animated,
        }),
      }))
      const payload = {
        nodes: nodePayload,
        edges: edgePayload,
        viewportX: viewport.x ?? 0,
        viewportY: viewport.y ?? 0,
        viewportZoom: viewport.zoom ?? 1,
      }
      const res = await axios.put(`${API}/${projectId}/graph`, payload, { withCredentials: true })
      console.log('[graphStore] saveGraph success — response:', res.status, 'saved nodes:', res.data?.nodes?.length)
      set({ saving: false })
      return { ok: true }
    } catch (err) {
      console.error('[graphStore] saveGraph FAILED — status:', err.response?.status, 'data:', err.response?.data, 'message:', err.message)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message
      set({ saving: false, error: errorMsg })
      return { ok: false, error: errorMsg }
    }
  },

  // POST /api/projects/{projectId}/graph/generate-code
  // Saves the current graph first, then generates prompt + AI code from nodes
  generateCode: async (projectId, flowObject) => {
    const { nodes = [], edges = [], viewport = {} } = flowObject || {}
    console.log('[graphStore] generateCode called, projectId=', projectId, 'nodes=', nodes.length)
    set({ generating: true, error: null })
    try {
      const nodePayload = nodes.map((n) => ({
        reactFlowId: n.id,
        type: n.type,
        positionX: n.position.x,
        positionY: n.position.y,
        prompt: n.data?.prompt || '',
        metadata: JSON.stringify({ ...n.data, onUpdate: undefined, onDelete: undefined }),
      }))
      const edgePayload = edges.map((e) => ({
        reactFlowId: e.id,
        sourceReactFlowId: e.source,
        targetReactFlowId: e.target,
        metadata: JSON.stringify({
          type: e.type,
          data: { ...(e.data || {}), onDelete: undefined },
          markerEnd: e.markerEnd,
          style: e.style,
          animated: e.animated,
        }),
      }))
      const payload = {
        nodes: nodePayload,
        edges: edgePayload,
        viewportX: viewport.x ?? 0,
        viewportY: viewport.y ?? 0,
        viewportZoom: viewport.zoom ?? 1,
      }
      const res = await axios.post(`${API}/${projectId}/graph/generate-code`, payload, { withCredentials: true })
      console.log('[graphStore] generateCode success — prompt length:', res.data?.prompt?.length, 'code length:', res.data?.generatedCode?.length)
      set({ generating: false })
      return { ok: true, data: res.data }
    } catch (err) {
      console.error('[graphStore] generateCode FAILED — status:', err.response?.status, 'data:', err.response?.data, 'message:', err.message)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message
      set({ generating: false, error: errorMsg })
      return { ok: false, error: errorMsg }
    }
  },

  // POST /api/projects/{projectId}/graph/get-prompt — Get raw prompt for external use
  getPrompt: async (projectId, flowObject) => {
    const { nodes = [], edges = [], viewport = {} } = flowObject || {}
    console.log('[graphStore] getPrompt called, projectId=', projectId)
    set({ generating: true, error: null })
    try {
      const payload = toGraphPayload(flowObject)
      const res = await axios.post(`${API}/${projectId}/graph/get-prompt`, payload, { withCredentials: true })
      console.log('[graphStore] getPrompt success — prompt length:', res.data?.prompt?.length)
      set({ generating: false })
      return { ok: true, data: res.data }
    } catch (err) {
      console.error('[graphStore] getPrompt FAILED:', err.response?.status, err.message)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message
      set({ generating: false, error: errorMsg })
      return { ok: false, error: errorMsg }
    }
  },

  clearError: () => set({ error: null }),

  // ─── Problem graph endpoints ───────────────────────────────────────────────

  // GET /api/problems/{problemId}/graph
  loadProblemGraph: async (problemId) => {
    console.log('[graphStore] loadProblemGraph called, problemId=', problemId)
    set({ loading: true, error: null })
    try {
      const res = await axios.get(`${PROBLEM_API}/${problemId}/graph`, { withCredentials: true })
      const graph = res.data
      console.log('[graphStore] loadProblemGraph success:', graph.nodes?.length, 'nodes,', graph.edges?.length, 'edges')
      set((state) => ({
        graphsByProjectId: { ...state.graphsByProjectId, [`problem-${problemId}`]: graph },
        loading: false,
      }))
      return { ok: true, data: graph }
    } catch (err) {
      console.error('[graphStore] loadProblemGraph FAILED:', err.response?.status, err.message)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message
      set({ loading: false, error: errorMsg })
      return { ok: false, error: errorMsg }
    }
  },

  // PUT /api/problems/{problemId}/graph
  saveProblemGraph: async (problemId, flowObject) => {
    console.log('[graphStore] saveProblemGraph called, problemId=', problemId)
    set({ saving: true, error: null })
    try {
      const payload = toGraphPayload(flowObject)
      const res = await axios.put(`${PROBLEM_API}/${problemId}/graph`, payload, { withCredentials: true })
      console.log('[graphStore] saveProblemGraph success — saved nodes:', res.data?.nodes?.length)
      set({ saving: false })
      return { ok: true }
    } catch (err) {
      console.error('[graphStore] saveProblemGraph FAILED:', err.response?.status, err.message)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message
      set({ saving: false, error: errorMsg })
      return { ok: false, error: errorMsg }
    }
  },

  // POST /api/problems/{problemId}/graph/generate-code
  generateProblemCode: async (problemId, flowObject) => {
    console.log('[graphStore] generateProblemCode called, problemId=', problemId)
    set({ generating: true, error: null })
    try {
      const payload = toGraphPayload(flowObject)
      const res = await axios.post(`${PROBLEM_API}/${problemId}/graph/generate-code`, payload, { withCredentials: true })
      console.log('[graphStore] generateProblemCode success — prompt length:', res.data?.prompt?.length, 'code length:', res.data?.generatedCode?.length)
      set({ generating: false })
      return { ok: true, data: res.data }
    } catch (err) {
      console.error('[graphStore] generateProblemCode FAILED:', err.response?.status, err.message)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message
      set({ generating: false, error: errorMsg })
      return { ok: false, error: errorMsg }
    }
  },

  // POST /api/problems/{problemId}/graph/get-prompt — Get raw prompt for external use
  getProblemPrompt: async (problemId, flowObject) => {
    console.log('[graphStore] getProblemPrompt called, problemId=', problemId)
    set({ generating: true, error: null })
    try {
      const payload = toGraphPayload(flowObject)
      const res = await axios.post(`${PROBLEM_API}/${problemId}/graph/get-prompt`, payload, { withCredentials: true })
      console.log('[graphStore] getProblemPrompt success — prompt length:', res.data?.prompt?.length)
      set({ generating: false })
      return { ok: true, data: res.data }
    } catch (err) {
      console.error('[graphStore] getProblemPrompt FAILED:', err.response?.status, err.message)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message
      set({ generating: false, error: errorMsg })
      return { ok: false, error: errorMsg }
    }
  },
}))

export default useGraphStore
