import { create } from 'zustand'
import axios from 'axios'

const API = 'http://localhost:8080/api/code/execute'

const useExecutionStore = create((set) => ({
  running: false,
  error: null,

  // POST /api/code/execute — runs a single test case
  // Returns a result object: { stdout, stderr, exitCode, error? }
  executeCode: async (languageId, code, stdin = '') => {
    set({ running: true, error: null })
    try {
      const payload = {
        languageId: Number(languageId),
        code,
        stdin: stdin || '',
      }
      const resp = await axios.post(API, payload)
      const body = resp.data
      const stdout = String(body.stdout ?? body.output ?? body.result ?? '').trim()
      const stderr = String(body.stderr ?? body.error ?? '')
      const exitCode = body.exitCode ?? body.exit_code ?? body.code ?? (stderr ? 1 : 0)
      set({ running: false })
      return { ok: true, stdout, stderr, exitCode }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Execution failed'
      console.error('executeCode error', err)
      set({ running: false, error: String(msg) })
      return { ok: false, error: String(msg) }
    }
  },

  clearError: () => set({ error: null }),
}))

export default useExecutionStore
