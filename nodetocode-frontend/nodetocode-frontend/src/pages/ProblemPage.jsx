import React from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import CodeEditor from '../components/CodeEditor'
import NodeEditor from '../components/NodeEditor'
import useAuthStore from '../store/authStore'
import useProblemStore from '../store/problemStore'
import useGraphStore from '../store/graphStore'

export default function ProblemPage() {
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const fetchProblem = useProblemStore((s) => s.fetchProblem)
  const problem = useProblemStore((s) => s.problemsById[String(id)])
  const loading = useProblemStore((s) => s.loading)

  React.useEffect(() => {
    if (id) fetchProblem(id)
  }, [id, fetchProblem])

  const templates = {
    java: `// Java template\n// Implement a function or class as needed.\npublic class Main {\n    // Example: static String solve(String input) { return input; }\n    public static void main(String[] args) {\n        // run local tests if needed\n    }\n}\n`,
    python: `# Python template\n# def solve(...):\n#     return ...\n\ndef solve(arg):\n    return arg\n`,
    cpp: `// C++ template\n#include <bits/stdc++.h>\nusing namespace std;\n// implement solve function\nint main() {\n    // run local tests\n    return 0;\n}\n`,
    javascript: `// JavaScript template\n// Implement a function named \"solve\"\nfunction solve(input) {\n  return input;\n}\n`,
  }
  const langIdMap = { java: 91, python: 109, cpp: 54, javascript: 29 }
  const [language, setLanguage] = React.useState('java')
  const languageId = langIdMap[language]
  const [stdinInput, setStdinInput] = React.useState('')
  const [stdinOpen, setStdinOpen] = React.useState(false)
  const [code, setCode] = React.useState(templates['java'])
  const [mode, setMode] = React.useState('manual')
  const [nodeCode, setNodeCode] = React.useState('')
  const [results, setResults] = React.useState([])
  const [running, setRunning] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [saveStatus, setSaveStatus] = React.useState(null) // 'saved' | 'error' | null
  const nodeEditorRef = React.useRef(null)
  const [nodeGenerating, setNodeGenerating] = React.useState(false)
  const [nodeGenStatus, setNodeGenStatus] = React.useState(null) // 'success' | 'error' | null

  // Called when NodeEditor generates code — update editor content and show it
  const handleNodeCodeChange = React.useCallback((generatedCode) => {
    setNodeCode(generatedCode)
    setCode(generatedCode)
    setMode('manual')
  }, [])

  /* ── Prompt modal state ── */
  const [promptModalOpen, setPromptModalOpen] = React.useState(false)
  const [promptText, setPromptText] = React.useState('')
  const [promptLoading, setPromptLoading] = React.useState(false)
  const [promptCopied, setPromptCopied] = React.useState(false)

  const handleNodeGenerate = async () => {
    if (!nodeEditorRef.current) return
    setNodeGenerating(true)
    setNodeGenStatus(null)
    try {
      await nodeEditorRef.current.triggerGenerate()
      setNodeGenStatus('success')
      setTimeout(() => setNodeGenStatus(null), 3000)
    } catch {
      setNodeGenStatus('error')
      setTimeout(() => setNodeGenStatus(null), 5000)
    } finally {
      setNodeGenerating(false)
    }
  }

  const handleGetPrompt = async () => {
    if (!nodeEditorRef.current) return
    setPromptLoading(true)
    try {
      const prompt = await nodeEditorRef.current.triggerGetPrompt()
      if (prompt) {
        setPromptText(prompt)
        setPromptModalOpen(true)
      }
    } catch (e) {
      console.error('Get prompt error:', e)
    } finally {
      setPromptLoading(false)
    }
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(promptText)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  /* ── Resizable horizontal split (desktop) ── */
  const containerRef = React.useRef(null)
  const [leftWidth, setLeftWidth] = React.useState(35) // percentage
  const dragging = React.useRef(false)

  const onMouseDown = (e) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  React.useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const pct = (x / rect.width) * 100
      setLeftWidth(Math.min(Math.max(pct, 15), 70))
    }
    const onMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  /* ── Touch support for mobile drag ── */
  const onTouchStart = () => { dragging.current = true }
  React.useEffect(() => {
    const onTouchMove = (e) => {
      if (!dragging.current || !containerRef.current) return
      const touch = e.touches[0]
      const rect = containerRef.current.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const pct = (x / rect.width) * 100
      setLeftWidth(Math.min(Math.max(pct, 15), 70))
    }
    const onTouchEnd = () => { dragging.current = false }
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  /* ── Resizable vertical split (editor / results on right pane) ── */
  const rightRef = React.useRef(null)
  const [editorHeight, setEditorHeight] = React.useState(65) // percentage
  const vDragging = React.useRef(false)

  const onVMouseDown = (e) => {
    e.preventDefault()
    vDragging.current = true
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }

  React.useEffect(() => {
    const onMove = (e) => {
      if (!vDragging.current || !rightRef.current) return
      const rect = rightRef.current.getBoundingClientRect()
      const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
      const pct = (y / rect.height) * 100
      setEditorHeight(Math.min(Math.max(pct, 20), 85))
    }
    const onEnd = () => {
      vDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [])

  const runTests = async () => {
    setRunning(true)
    setResults([])
    const sourceCode = mode === 'manual' ? code : nodeCode
    const stdin = problem.sampleInput || ''
    const expectedOutput = (problem.sampleOutput || '').trim()
    try {
      const payload = {
        languageId: Number(languageId),
        code: sourceCode,
        stdin,
      }
      const resp = await axios.post('http://localhost:8080/api/code/execute', payload)
      const body = resp.data
      const stdout = (body.stdout ?? '').trim()
      const stderr = body.stderr ?? ''
      const compileOutput = body.compile_output ?? ''
      const statusId = body.status?.id ?? null
      const statusDesc = body.status?.description ?? ''
      const time = body.time ?? null
      const memory = body.memory ?? null
      const accepted = statusId === 3
      const passed = accepted && expectedOutput !== '' && stdout === expectedOutput
      setResults([{
        type: 'test',
        stdout: String(stdout),
        stderr: String(stderr),
        compileOutput: String(compileOutput),
        statusId, statusDesc, time, memory, accepted, passed,
        expected: expectedOutput,
        input: stdin,
      }])
      saveCode(sourceCode)

      // Mark solved on backend if passed
      if (passed) {
        try {
          await axios.post('http://localhost:8080/api/submissions/solve', {
            problemId: Number(id),
            language: language.toUpperCase(),
            code: sourceCode,
          }, { withCredentials: true })
        } catch (e) {
          console.error('Failed to mark solved:', e)
        }
      }
    } catch (err) {
      console.error('Execution error:', err)
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Execution failed'
      setResults([{ type: 'test', error: String(msg), expected: expectedOutput, input: stdin }])
    } finally {
      setRunning(false)
    }
  }

  const runCustom = async () => {
    setRunning(true)
    setResults([])
    const sourceCode = mode === 'manual' ? code : nodeCode
    try {
      const payload = {
        languageId: Number(languageId),
        code: sourceCode,
        stdin: stdinInput || '',
      }
      const resp = await axios.post('http://localhost:8080/api/code/execute', payload)
      const body = resp.data
      const stdout = body.stdout ?? ''
      const stderr = body.stderr ?? ''
      const compileOutput = body.compile_output ?? ''
      const statusId = body.status?.id ?? null
      const statusDesc = body.status?.description ?? ''
      const time = body.time ?? null
      const memory = body.memory ?? null
      const accepted = statusId === 3
      setResults([{ type: 'custom', stdout: String(stdout), stderr: String(stderr), compileOutput: String(compileOutput), statusId, statusDesc, time, memory, accepted }])
    } catch (err) {
      console.error('Execution error:', err)
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Execution failed'
      setResults([{ type: 'custom', error: String(msg) }])
    } finally {
      setRunning(false)
    }
  }

  /* ── Save code to backend ── */
  const saveCode = async (codeToSave) => {
    if (!id || !user) return
    setSaving(true)
    setSaveStatus(null)
    try {
      await axios.post('http://localhost:8080/api/submissions', {
        problemId: Number(id),
        language: language.toUpperCase(),
        code: codeToSave ?? (mode === 'manual' ? code : nodeCode),
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      console.error('Save error:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  /* ── Load saved code from backend ── */
  const loadSavedCode = async (lang) => {
    if (!id || !user) return
    try {
      const resp = await axios.get('http://localhost:8080/api/submissions', {
        params: { problemId: Number(id), language: lang.toUpperCase() },
      })
      if (resp.data && resp.data.code) {
        setCode(resp.data.code)
      } else {
        setCode(templates[lang] || '')
      }
    } catch {
      setCode(templates[lang] || '')
    }
  }

  React.useEffect(() => { loadSavedCode(language) }, [language, id, user])

  /* ── Mobile tab state ── */
  const [mobileTab, setMobileTab] = React.useState('problem') // 'problem' | 'editor' | 'results'

  if (!user) return <div className="h-screen flex items-center justify-center text-white/60">Not authenticated</div>
  if (loading) return <div className="h-screen flex items-center justify-center text-white/60">Loading problem...</div>
  if (!problem) return <div className="h-screen flex items-center justify-center text-white/60">Problem not found</div>

  /* ── Difficulty badge helper ── */
  const diffBadge = () => {
    const k = problem.difficulty?.toLowerCase()
    if (k === 'easy') return 'text-blue-400'
    if (k === 'medium') return 'text-amber-400'
    if (k === 'hard') return 'text-rose-400'
    return 'text-gray-400'
  }

  /* ── Clipboard helper ── */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  /* ── Format test case text for readable display ── */
  const formatTestCase = (text) => {
    if (!text) return null
    const raw = text.trim()
    let lines = raw.split('\n')
    // If single line, try splitting on semicolons (e.g. "AddBook(...); RegisterMember(...); ...")
    if (lines.length === 1) {
      const line = lines[0]
      if (line.includes(';')) {
        lines = line.split(';').map(l => l.trim()).filter(Boolean)
      } else if (line.includes('\\n')) {
        lines = line.split('\\n').map(l => l.trim()).filter(Boolean)
      }
    }
    return lines
  }

  /* ── Render formatted lines with line numbers ── */
  const TestCaseBlock = ({ text, color }) => {
    const lines = formatTestCase(text)
    if (!lines) return null
    return (
      <div className="font-mono text-[13px] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="flex hover:bg-white/[0.03] transition-colors">
            <span className="select-none w-8 shrink-0 text-right pr-3 text-white/20 text-[11px] leading-relaxed">{i + 1}</span>
            <span className={`${color} flex-1 whitespace-pre`}>{line}</span>
          </div>
        ))}
      </div>
    )
  }

  /* ── Problem description panel content ── */
  const ProblemPanel = () => (
    <div className="h-full overflow-y-auto p-4 md:p-5 custom-scrollbar bg-black/50">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-white/90">{problem.title}</h2>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${diffBadge()} ${
          problem.difficulty?.toLowerCase() === 'easy' ? 'border-blue-400/30 bg-blue-400/10' :
          problem.difficulty?.toLowerCase() === 'medium' ? 'border-amber-400/30 bg-amber-400/10' :
          problem.difficulty?.toLowerCase() === 'hard' ? 'border-rose-400/30 bg-rose-400/10' :
          'border-gray-400/30 bg-gray-400/10'
        }`}>{problem.difficulty}</span>
      </div>
      <div className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{problem.description}</div>

      {/* ── Test Cases Section ── */}
      {(problem.sampleInput || problem.sampleOutput) && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-sm font-semibold text-white/80">Test Cases</h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {/* Input */}
            {problem.sampleInput && (
              <div className="border-b border-white/10">
                <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03]">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Input</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setStdinInput(problem.sampleInput); setMobileTab?.('editor') }}
                      title="Use as stdin input"
                      className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition font-medium"
                    >
                      Use as Input
                    </button>
                    <button
                      onClick={() => copyToClipboard(problem.sampleInput)}
                      title="Copy to clipboard"
                      className="p-1 rounded hover:bg-white/10 transition text-white/40 hover:text-white/70"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3 overflow-x-auto">
                  <TestCaseBlock text={problem.sampleInput} color="text-emerald-300/90" />
                </div>
              </div>
            )}

            {/* Output */}
            {problem.sampleOutput && (
              <div>
                <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03]">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Expected Output</span>
                  <button
                    onClick={() => copyToClipboard(problem.sampleOutput)}
                    title="Copy to clipboard"
                    className="p-1 rounded hover:bg-white/10 transition text-white/40 hover:text-white/70"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="px-4 py-3 overflow-x-auto">
                  <TestCaseBlock text={problem.sampleOutput} color="text-amber-300/90" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  /* ── Editor toolbar ── */
  const Toolbar = () => (
    <div className="flex flex-col bg-black/30 border-b border-white/10">
      <div className="flex items-center justify-between px-3 py-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md px-2 py-1 text-xs bg-black text-white border border-white/10 focus:border-blue-500/50 focus:outline-none transition">
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>
          <div className="inline-flex rounded-md bg-white/5 p-0.5">
            <button onClick={() => setMode('manual')} className={`px-2.5 py-1 text-xs rounded-md transition ${mode === 'manual' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/70'}`}>Code</button>
            <button onClick={() => setMode('nodes')} className={`px-2.5 py-1 text-xs rounded-md transition ${mode === 'nodes' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/70'}`}>Nodes</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setStdinOpen(!stdinOpen)}
            className={`px-2 py-1 text-xs rounded-md border transition flex items-center gap-1 ${
              stdinOpen ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'
            }`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            stdin{stdinInput ? ' *' : ''}
          </button>
          <button onClick={() => saveCode()} disabled={saving}
            className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/70 hover:text-white px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 border border-white/10">
            {saving ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Saving
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Saved
              </span>
            ) : saveStatus === 'error' ? (
              <span className="text-red-400">Failed</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3M8 7V3h8v4M8 7h8M9 14h6" />
                </svg>
                Save
              </>
            )}
          </button>
          {stdinOpen && stdinInput.trim() ? (
            <button onClick={runCustom} disabled={running}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5">
              {running ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Running
                </span>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Custom Run
                </>
              )}
            </button>
          ) : null}
          {mode === 'nodes' ? (
            <>
            <button onClick={handleGetPrompt} disabled={promptLoading}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5">
              {promptLoading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Loading
                </span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Get Prompt
                </>
              )}
            </button>
            <button onClick={handleNodeGenerate} disabled={nodeGenerating}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5">
              {nodeGenerating ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Generating
                </span>
              ) : nodeGenStatus === 'success' ? (
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  Generated!
                </span>
              ) : nodeGenStatus === 'error' ? (
                <span className="text-red-300">Failed</span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Code
                </>
              )}
            </button>
            </>
          ) : (
            <button onClick={runTests} disabled={running}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5">
              {running ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Running
                </span>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Run Tests
                </>
              )}
            </button>
          )}
        </div>
      </div>
      {/* Expandable stdin textarea */}
      {stdinOpen && (
        <div className="px-3 pb-2">
          <textarea
            value={stdinInput}
            onChange={(e) => setStdinInput(e.target.value)}
            placeholder="Enter input (stdin) here..."
            rows={3}
            className="w-full rounded-md px-3 py-2 text-xs font-mono bg-black text-white/80 border border-white/10 placeholder-white/30 focus:outline-none focus:border-blue-500/50 resize-y"
          />
        </div>
      )}
    </div>
  )

  /* ── Results panel content ── */
  const ResultsPanel = () => (
    <div className="h-full overflow-y-auto p-3 custom-scrollbar">
      {results.length === 0 && <div className="text-xs text-white/30">Run your code to see output here</div>}
      {results.map((r, i) => (
        <div key={i} className="space-y-3">
          {/* ── Header with verdict ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              {r.type === 'test' ? 'Test Result' : 'Custom Run'}
            </h4>
            {!r.error && r.type === 'test' && (
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-wide ${
                r.passed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : r.accepted
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {r.passed ? 'PASSED' : r.accepted ? 'WRONG ANSWER' : (r.statusDesc || 'ERROR')}
              </span>
            )}
            {!r.error && r.type === 'custom' && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                r.accepted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {r.statusDesc || (r.accepted ? 'Executed' : 'Error')}
              </span>
            )}
            {!r.error && r.time != null && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                {r.time}s
              </span>
            )}
            {!r.error && r.memory != null && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                {(r.memory / 1024).toFixed(1)} MB
              </span>
            )}
          </div>

          {r.error ? (
            <pre className="text-xs text-red-400 whitespace-pre-wrap bg-red-500/5 p-3 rounded-lg border border-red-500/10">{r.error}</pre>
          ) : (
            <>
              {/* Compilation error */}
              {r.compileOutput && r.compileOutput.trim() && (
                <div>
                  <span className="text-[10px] font-semibold text-red-400/70 uppercase tracking-wider">Compilation Error</span>
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-red-300 bg-red-500/5 p-3 rounded-lg border border-red-500/10">{r.compileOutput}</pre>
                </div>
              )}

              {/* Stderr */}
              {r.stderr && r.stderr.trim() && (
                <div>
                  <span className="text-[10px] font-semibold text-red-400/70 uppercase tracking-wider">stderr</span>
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-red-300 bg-red-500/5 p-3 rounded-lg border border-red-500/10 font-mono">{r.stderr}</pre>
                </div>
              )}

              {/* Test case comparison (for test runs) */}
              {r.type === 'test' && r.accepted && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  {/* Input */}
                  {r.input && (
                    <div className="border-b border-white/10">
                      <div className="px-4 py-1.5 bg-white/[0.03]">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Input</span>
                      </div>
                      <pre className="px-4 py-2 text-[12px] font-mono text-white/60 leading-relaxed overflow-x-auto">{r.input}</pre>
                    </div>
                  )}
                  {/* Your Output */}
                  <div className="border-b border-white/10">
                    <div className="px-4 py-1.5 bg-white/[0.03]">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Your Output</span>
                    </div>
                    <pre className={`px-4 py-2 text-[12px] font-mono leading-relaxed overflow-x-auto ${
                      r.passed ? 'text-emerald-300/90' : 'text-red-300/90'
                    }`}>{r.stdout || <span className="text-white/20 italic">No output</span>}</pre>
                  </div>
                  {/* Expected Output */}
                  {r.expected && (
                    <div>
                      <div className="px-4 py-1.5 bg-white/[0.03]">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Expected Output</span>
                      </div>
                      <pre className="px-4 py-2 text-[12px] font-mono text-emerald-300/90 leading-relaxed overflow-x-auto">{r.expected}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Custom run output (no comparison) */}
              {r.type === 'custom' && (
                <div>
                  {r.stdout && r.stdout.trim() ? (
                    <div>
                      <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">stdout</span>
                      <pre className="mt-1 whitespace-pre-wrap text-xs text-white/80 bg-white/5 p-3 rounded-lg border border-white/10 font-mono">{r.stdout}</pre>
                    </div>
                  ) : (
                    !r.compileOutput?.trim() && !r.stderr?.trim() && (
                      <p className="text-xs text-white/30 italic">No output</p>
                    )
                  )}
                </div>
              )}

              {/* No output fallback for test runs */}
              {r.type === 'test' && !r.accepted && !r.compileOutput?.trim() && !r.stderr?.trim() && !r.stdout?.trim() && (
                <p className="text-xs text-white/30 italic">No output</p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <>
      {/* ════════ MOBILE LAYOUT ════════ */}
      <div className="lg:hidden h-[calc(100vh-64px)] flex flex-col">
        {/* Mobile tab bar */}
        <div className="flex bg-black/40 border-b border-white/10 shrink-0">
          {['problem', 'editor', 'results'].map((tab) => (
            <button key={tab} onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition ${mobileTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-white/40'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden bg-black/20">
          {mobileTab === 'problem' && <ProblemPanel />}
          {mobileTab === 'editor' && (
            <div className="h-full flex flex-col">
              <Toolbar />
              <div className="flex-1">
                {mode === 'manual' ? (
                  <CodeEditor language={language} value={code} onChange={(v) => setCode(v)} />
                ) : (
                  <NodeEditor ref={nodeEditorRef} problemId={id} onCodeChange={handleNodeCodeChange} />
                )}
              </div>
            </div>
          )}
          {mobileTab === 'results' && <ResultsPanel />}
        </div>
      </div>

      {/* ════════ DESKTOP LAYOUT ════════ */}
      <div ref={containerRef} className="hidden lg:flex h-[calc(100vh-64px)] w-full">

        {/* ── Left: Problem Statement ── */}
        <div style={{ width: `${leftWidth}%` }} className="h-full bg-black/20 border-r border-white/10 shrink-0 flex flex-col">
          <div className="px-4 py-2.5 border-b border-white/10 bg-black/30">
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Description</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ProblemPanel />
          </div>
        </div>

        {/* ── Horizontal resize handle ── */}
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className="w-1 hover:w-1.5 bg-white/5 hover:bg-blue-500/40 cursor-col-resize transition-all shrink-0 active:bg-blue-500/60"
        />

        {/* ── Right: Editor + Results ── */}
        <div ref={rightRef} className="flex-1 h-full flex flex-col min-w-0">
          <Toolbar />

          {/* Editor area */}
          <div style={{ height: `${editorHeight}%` }} className="shrink-0 overflow-hidden">
            {mode === 'manual' ? (
              <CodeEditor language={language} value={code} onChange={(v) => setCode(v)} />
            ) : (
              <div className="h-full">
                <NodeEditor ref={nodeEditorRef} problemId={id} onCodeChange={handleNodeCodeChange} />
              </div>
            )}
          </div>

          {/* ── Vertical resize handle ── */}
          <div
            onMouseDown={onVMouseDown}
            onTouchStart={() => { vDragging.current = true }}
            className="h-1 hover:h-1.5 bg-white/5 hover:bg-blue-500/40 cursor-row-resize transition-all shrink-0 active:bg-blue-500/60"
          />

          {/* Results area */}
          <div className="flex-1 bg-black/20 border-t border-white/10 overflow-hidden">
            <ResultsPanel />
          </div>
        </div>
      </div>

      {/* ════════ PROMPT MODAL ════════ */}
      <AnimatePresence>
        {promptModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPromptModalOpen(false)}
          >
            <motion.div
              className="bg-[#111] border border-white/10 rounded-2xl w-[90vw] max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white/80">Generated Prompt</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyPrompt}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition flex items-center gap-1.5"
                  >
                    {promptCopied ? (
                      <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Copied!</>
                    ) : (
                      <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
                    )}
                  </button>
                  <button
                    onClick={() => setPromptModalOpen(false)}
                    className="text-white/40 hover:text-white/80 transition p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono leading-relaxed">{promptText}</pre>
              </div>
              <div className="px-5 py-3 border-t border-white/10">
                <p className="text-[10px] text-white/30">Copy this prompt and paste it into any AI chatbot (ChatGPT, Gemini, Claude, etc.) to generate code.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
