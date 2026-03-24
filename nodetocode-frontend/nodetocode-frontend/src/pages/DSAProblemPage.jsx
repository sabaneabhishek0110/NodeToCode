import React from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import CodeEditor from '../components/CodeEditor'
import NodeEditor from '../components/NodeEditor'
import useAuthStore from '../store/authStore'
import useDSAProblemStore from '../store/dsaProblemStore'

export default function DSAProblemPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isArena = searchParams.get('arena') === '1'
  const arenaTestId = searchParams.get('testId')
  const arenaProblems = searchParams.get('problems') // comma-separated IDs
  const arenaIdx = parseInt(searchParams.get('idx') ?? '0', 10)
  const arenaProblemIds = arenaProblems ? arenaProblems.split(',').map(Number) : []
  const user = useAuthStore((s) => s.user)
  const fetchDSAProblem = useDSAProblemStore((s) => s.fetchDSAProblem)
  const problem = useDSAProblemStore((s) => s.dsaProblemsById[String(id)])
  const loading = useDSAProblemStore((s) => s.loading)

  React.useEffect(() => {
    if (id) fetchDSAProblem(id)
  }, [id, fetchDSAProblem])

  const templates = {
    java: `// Java template\npublic class Main {\n    public static void main(String[] args) {\n        // implement solution\n    }\n}\n`,
    python: `# Python template\ndef solve():\n    pass\n\nsolve()\n`,
    cpp: `// C++ template\n#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // implement solution\n    return 0;\n}\n`,
    javascript: `// JavaScript template\nfunction solve(input) {\n  return input;\n}\n`,
  }
  const langIdMap = { java: 91, python: 109, cpp: 54, javascript: 29 }
  const [language, setLanguage] = React.useState('java')
  const languageId = langIdMap[language]
  const [stdinInput, setStdinInput] = React.useState('')
  const [stdinOpen, setStdinOpen] = React.useState(false)
  const [code, setCode] = React.useState(templates['java'])
  const [mode, setMode] = React.useState('manual')

  // In arena mode, force manual-only (no node editor)
  React.useEffect(() => { if (isArena) setMode('manual') }, [isArena])
  const [nodeCode, setNodeCode] = React.useState('')
  const [results, setResults] = React.useState([])
  const [running, setRunning] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [saveStatus, setSaveStatus] = React.useState(null)

  /* ── Resizable horizontal split (desktop) ── */
  const containerRef = React.useRef(null)
  const [leftWidth, setLeftWidth] = React.useState(35)
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

  /* ── Resizable vertical split ── */
  const rightRef = React.useRef(null)
  const [editorHeight, setEditorHeight] = React.useState(65)
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
      const payload = { languageId: Number(languageId), code: sourceCode, stdin }
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
        type: 'test', stdout: String(stdout), stderr: String(stderr),
        compileOutput: String(compileOutput), statusId, statusDesc, time, memory, accepted, passed,
        expected: expectedOutput, input: stdin,
      }])
      if (!isArena) saveCode(sourceCode)

      // Mark solved on backend if passed
      if (passed) {
        if (isArena && arenaTestId) {
          // In arena mode, broadcast solve event to the arena tab instead of global solve
          try {
            localStorage.setItem('arena_solved', JSON.stringify({
              testId: arenaTestId, problemId: Number(id), ts: Date.now(),
            }))
          } catch (_) {}
        } else {
          try {
            await axios.post('http://localhost:8080/api/dsa-submissions/solve', {
              problemId: Number(id), language: language.toUpperCase(), code: sourceCode,
            }, { withCredentials: true })
          } catch (e) { console.error('Failed to mark solved:', e) }
        }
      }
    } catch (err) {
      console.error('Execution error:', err)
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Execution failed'
      setResults([{ type: 'test', error: String(msg), expected: expectedOutput, input: stdin }])
    } finally { setRunning(false) }
  }

  const runCustom = async () => {
    setRunning(true)
    setResults([])
    const sourceCode = mode === 'manual' ? code : nodeCode
    try {
      const payload = { languageId: Number(languageId), code: sourceCode, stdin: stdinInput || '' }
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
    } finally { setRunning(false) }
  }

  /* ── Save code to backend ── */
  const saveCode = async (codeToSave) => {
    if (!id || !user) return
    setSaving(true)
    setSaveStatus(null)
    try {
      await axios.post('http://localhost:8080/api/dsa-submissions', {
        problemId: Number(id), language: language.toUpperCase(),
        code: codeToSave ?? (mode === 'manual' ? code : nodeCode),
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      console.error('Save error:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    } finally { setSaving(false) }
  }

  /* ── Load saved code from backend (skip in arena – always start fresh) ── */
  const loadSavedCode = async (lang) => {
    if (!id || !user) return
    if (isArena) { setCode(templates[lang] || ''); return }
    try {
      const resp = await axios.get('http://localhost:8080/api/dsa-submissions', {
        params: { problemId: Number(id), language: lang.toUpperCase() },
      })
      if (resp.data && resp.data.code) {
        setCode(resp.data.code)
      } else {
        setCode(templates[lang] || '')
      }
    } catch { setCode(templates[lang] || '') }
  }

  React.useEffect(() => { loadSavedCode(language) }, [language, id, user])

  const [mobileTab, setMobileTab] = React.useState('problem')

  if (!user) return <div className="h-screen flex items-center justify-center text-white/60">Not authenticated</div>
  if (loading) return <div className="h-screen flex items-center justify-center text-white/60">Loading problem...</div>
  if (!problem) return <div className="h-screen flex items-center justify-center text-white/60">Problem not found</div>

  const diffBadge = () => {
    const k = problem.difficulty?.toLowerCase()
    if (k === 'easy') return 'text-blue-400'
    if (k === 'medium') return 'text-amber-400'
    if (k === 'hard') return 'text-rose-400'
    return 'text-gray-400'
  }

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text).catch(() => {}) }

  const formatTestCase = (text) => {
    if (!text) return null
    const raw = text.trim()
    let lines = raw.split('\n')
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

  /* ── Problem description panel ── */
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

      {(problem.sampleInput || problem.sampleOutput) && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-sm font-semibold text-white/80">Test Cases</h3>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {problem.sampleInput && (
              <div className="border-b border-white/10">
                <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03]">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Input</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setStdinInput(problem.sampleInput); setMobileTab?.('editor') }}
                      title="Use as stdin input"
                      className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition font-medium">
                      Use as Input
                    </button>
                    <button onClick={() => copyToClipboard(problem.sampleInput)} title="Copy to clipboard"
                      className="p-1 rounded hover:bg-white/10 transition text-white/40 hover:text-white/70">
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
            {problem.sampleOutput && (
              <div>
                <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03]">
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Expected Output</span>
                  <button onClick={() => copyToClipboard(problem.sampleOutput)} title="Copy to clipboard"
                    className="p-1 rounded hover:bg-white/10 transition text-white/40 hover:text-white/70">
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
          {!isArena && (
            <div className="inline-flex rounded-md bg-white/5 p-0.5">
              <button onClick={() => setMode('manual')} className={`px-2.5 py-1 text-xs rounded-md transition ${mode === 'manual' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/70'}`}>Code</button>
              <button onClick={() => setMode('nodes')} className={`px-2.5 py-1 text-xs rounded-md transition ${mode === 'nodes' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/70'}`}>Nodes</button>
            </div>
          )}
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
          {!isArena && (
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
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                  Save
                </>
              )}
            </button>
          )}
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
          {isArena && (
            <button
              onClick={async () => {
                if (!window.confirm('Submit the entire Arena test now? This will end your test session.')) return
                try {
                  // Collect all solved IDs tracked by the Arena tab via localStorage
                  const stored = localStorage.getItem(`arena_solved_ids_${arenaTestId}`)
                  const solvedIdsArr = stored ? JSON.parse(stored) : []
                  const res = await axios.post(
                    `http://localhost:8080/api/arena/${arenaTestId}/finish`,
                    { solvedProblemIds: solvedIdsArr }
                  )
                  // Clean up persisted keys
                  localStorage.removeItem(`arena_solved_ids_${arenaTestId}`)
                  localStorage.removeItem('arena_solved')
                  localStorage.removeItem('arena_submit')
                  navigate('/arena', { state: { arenaResults: res.data } })
                } catch (err) {
                  alert('Failed to submit test: ' + (err.response?.data?.error || err.message))
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 border border-indigo-400/30"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              Submit Test
            </button>
          )}
        </div>
      </div>
      {stdinOpen && (
        <div className="px-3 pb-2">
          <textarea value={stdinInput} onChange={(e) => setStdinInput(e.target.value)}
            placeholder="Enter input (stdin) here..." rows={3}
            className="w-full rounded-md px-3 py-2 text-xs font-mono bg-black text-white/80 border border-white/10 placeholder-white/30 focus:outline-none focus:border-blue-500/50 resize-y" />
        </div>
      )}
      {/* Arena question navigator */}
      {isArena && arenaProblemIds.length > 1 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-white/[0.06] bg-black/40">
          <button
            onClick={() => {
              const prevIdx = arenaIdx - 1
              if (prevIdx < 0) return
              navigate(`/dsa-problems/${arenaProblemIds[prevIdx]}?arena=1&testId=${arenaTestId}&problems=${arenaProblems}&idx=${prevIdx}`)
            }}
            disabled={arenaIdx === 0}
            className="p-1 rounded text-white/40 hover:text-white/80 disabled:opacity-20 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          {arenaProblemIds.map((pid, idx) => (
            <button
              key={pid}
              onClick={() => navigate(`/dsa-problems/${pid}?arena=1&testId=${arenaTestId}&problems=${arenaProblems}&idx=${idx}`)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition ${
                idx === arenaIdx
                  ? 'bg-indigo-600/60 text-white border border-indigo-400/40'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              Q{idx + 1}
            </button>
          ))}
          <button
            onClick={() => {
              const nextIdx = arenaIdx + 1
              if (nextIdx >= arenaProblemIds.length) return
              navigate(`/dsa-problems/${arenaProblemIds[nextIdx]}?arena=1&testId=${arenaTestId}&problems=${arenaProblems}&idx=${nextIdx}`)
            }}
            disabled={arenaIdx === arenaProblemIds.length - 1}
            className="p-1 rounded text-white/40 hover:text-white/80 disabled:opacity-20 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <span className="ml-auto text-[10px] text-white/25">Arena · Q{arenaIdx + 1}/{arenaProblemIds.length}</span>
        </div>
      )}
    </div>
  )

  /* ── Results panel ── */
  const ResultsPanel = () => (
    <div className="h-full overflow-y-auto p-3 custom-scrollbar">
      {results.length === 0 && <div className="text-xs text-white/30">Run your code to see output here</div>}
      {results.map((r, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              {r.type === 'test' ? 'Test Result' : 'Custom Run'}
            </h4>
            {!r.error && r.type === 'test' && (
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-wide ${
                r.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : r.accepted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {r.passed ? 'PASSED' : r.accepted ? 'WRONG ANSWER' : (r.statusDesc || 'ERROR')}
              </span>
            )}
            {!r.error && r.type === 'custom' && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                r.accepted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {r.statusDesc || (r.accepted ? 'Executed' : 'Error')}
              </span>
            )}
            {!r.error && r.time != null && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">{r.time}s</span>
            )}
            {!r.error && r.memory != null && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">{(r.memory / 1024).toFixed(1)} MB</span>
            )}
          </div>

          {r.error ? (
            <pre className="text-xs text-red-400 whitespace-pre-wrap bg-red-500/5 p-3 rounded-lg border border-red-500/10">{r.error}</pre>
          ) : (
            <>
              {r.compileOutput && r.compileOutput.trim() && (
                <div>
                  <span className="text-[10px] font-semibold text-red-400/70 uppercase tracking-wider">Compilation Error</span>
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-red-300 bg-red-500/5 p-3 rounded-lg border border-red-500/10">{r.compileOutput}</pre>
                </div>
              )}
              {r.stderr && r.stderr.trim() && (
                <div>
                  <span className="text-[10px] font-semibold text-red-400/70 uppercase tracking-wider">stderr</span>
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-red-300 bg-red-500/5 p-3 rounded-lg border border-red-500/10 font-mono">{r.stderr}</pre>
                </div>
              )}
              {r.type === 'test' && r.accepted && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  {r.input && (
                    <div className="border-b border-white/10">
                      <div className="px-4 py-1.5 bg-white/[0.03]"><span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Input</span></div>
                      <pre className="px-4 py-2 text-[12px] font-mono text-white/60 leading-relaxed overflow-x-auto">{r.input}</pre>
                    </div>
                  )}
                  <div className="border-b border-white/10">
                    <div className="px-4 py-1.5 bg-white/[0.03]"><span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Your Output</span></div>
                    <pre className={`px-4 py-2 text-[12px] font-mono leading-relaxed overflow-x-auto ${r.passed ? 'text-emerald-300/90' : 'text-red-300/90'}`}>{r.stdout || <span className="text-white/20 italic">No output</span>}</pre>
                  </div>
                  {r.expected && (
                    <div>
                      <div className="px-4 py-1.5 bg-white/[0.03]"><span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Expected Output</span></div>
                      <pre className="px-4 py-2 text-[12px] font-mono text-emerald-300/90 leading-relaxed overflow-x-auto">{r.expected}</pre>
                    </div>
                  )}
                </div>
              )}
              {r.type === 'custom' && (
                <div>
                  {r.stdout && r.stdout.trim() ? (
                    <div>
                      <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">stdout</span>
                      <pre className="mt-1 whitespace-pre-wrap text-xs text-white/80 bg-white/5 p-3 rounded-lg border border-white/10 font-mono">{r.stdout}</pre>
                    </div>
                  ) : (
                    !r.compileOutput?.trim() && !r.stderr?.trim() && <p className="text-xs text-white/30 italic">No output</p>
                  )}
                </div>
              )}
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
      {/* Arena mode banner */}
      {isArena && (
        <div className="bg-indigo-600/20 border-b border-indigo-500/30 px-4 py-2 flex items-center justify-center gap-2 text-xs text-indigo-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="font-medium">Arena Mode</span> — Paste disabled · No saved code · Solve by passing test cases
        </div>
      )}

      {/* ═══ MOBILE LAYOUT ═══ */}
      <div className={`lg:hidden ${isArena ? 'h-[calc(100vh-64px-36px)]' : 'h-[calc(100vh-64px)]'} flex flex-col`}>
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
                  <CodeEditor language={language} value={code} onChange={(v) => setCode(v)} disablePaste={isArena} />
                ) : (
                  <NodeEditor initial={null} onCodeChange={setNodeCode} />
                )}
              </div>
            </div>
          )}
          {mobileTab === 'results' && <ResultsPanel />}
        </div>
      </div>

      {/* ═══ DESKTOP LAYOUT ═══ */}
      <div ref={containerRef} className={`hidden lg:flex ${isArena ? 'h-[calc(100vh-64px-36px)]' : 'h-[calc(100vh-64px)]'} w-full`}>
        <div style={{ width: `${leftWidth}%` }} className="h-full bg-black/20 border-r border-white/10 shrink-0 flex flex-col">
          <div className="px-4 py-2.5 border-b border-white/10 bg-black/30">
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Description</span>
          </div>
          <div className="flex-1 overflow-hidden"><ProblemPanel /></div>
        </div>

        <div onMouseDown={onMouseDown} onTouchStart={onTouchStart}
          className="w-1 hover:w-1.5 bg-white/5 hover:bg-blue-500/40 cursor-col-resize transition-all shrink-0 active:bg-blue-500/60" />

        <div ref={rightRef} className="flex-1 h-full flex flex-col min-w-0">
          <Toolbar />
          <div style={{ height: `${editorHeight}%` }} className="shrink-0 overflow-hidden">
            {mode === 'manual' ? (
              <CodeEditor language={language} value={code} onChange={(v) => setCode(v)} disablePaste={isArena} />
            ) : (
              <div className="h-full"><NodeEditor initial={null} onCodeChange={setNodeCode} /></div>
            )}
          </div>
          <div onMouseDown={onVMouseDown} onTouchStart={() => { vDragging.current = true }}
            className="h-1 hover:h-1.5 bg-white/5 hover:bg-blue-500/40 cursor-row-resize transition-all shrink-0 active:bg-blue-500/60" />
          <div className="flex-1 bg-black/20 border-t border-white/10 overflow-hidden"><ResultsPanel /></div>
        </div>
      </div>
    </>
  )
}
