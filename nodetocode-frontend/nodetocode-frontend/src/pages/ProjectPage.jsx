import React from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CodeEditor from '../components/CodeEditor'
import NodeEditor from '../components/NodeEditor'
import useAuthStore from '../store/authStore'
import useProjectStore from '../store/projectStore'
import useExecutionStore from '../store/executionStore'

/* ── Framer variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' } }),
}
const fadeSide = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

/* ── Skeleton loader ── */
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />
}

function LoadingScreen() {
  return (
    <motion.div
      className="h-screen flex flex-col items-center justify-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-white/60 text-sm">Loading project...</span>
      </div>
      <div className="w-72 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </motion.div>
  )
}

export default function ProjectPage() {
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const fetchProject = useProjectStore((s) => s.fetchProject)
  const saveCodeToStore = useProjectStore((s) => s.saveCode)
  const saveGeneratedPromptToStore = useProjectStore((s) => s.saveGeneratedPrompt)
  const storeProject = useProjectStore((s) => s.projectsById[String(id)])
  const storeLoading = useProjectStore((s) => s.loading)
  const executeCode = useExecutionStore((s) => s.executeCode)

  const [project, setProject] = React.useState(null)
  const [pageReady, setPageReady] = React.useState(false)

  React.useEffect(() => {
    if (id) {
      fetchProject(id).then((p) => {
        if (p) setProject(p)
        // small delay so skeleton feels natural
        setTimeout(() => setPageReady(true), 350)
      })
    }
  }, [id, fetchProject])

  React.useEffect(() => {
    if (storeProject && !project) {
      setProject(storeProject)
    }
  }, [storeProject, project])

  const templates = {
    java: `// Java template\npublic class Main {\n    public static void main(String[] args) {\n        // your code here\n    }\n}\n`,
    python: `# Python template\ndef solve(arg):\n    return arg\n`,
    cpp: `// C++ template\n#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // your code here\n    return 0;\n}\n`,
    javascript: `// JavaScript template\nfunction solve(input) {\n  return input;\n}\n`,
  }

  const langIdMap = { java: 91, python: 109, cpp: 54, javascript: 29 }
  const projectLang = project?.language?.toLowerCase() || 'java'
  const normalizedLang = projectLang === 'c++' ? 'cpp' : projectLang

  const [language, setLanguage] = React.useState('java')
  const languageId = langIdMap[language]
  const [code, setCode] = React.useState('')
  const [mode, setMode] = React.useState('manual')
  const [nodeCode, setNodeCode] = React.useState('')
  const [results, setResults] = React.useState([])

  // Called when NodeEditor generates code — update editor content and show it
  const handleNodeCodeChange = React.useCallback((generatedCode) => {
    setNodeCode(generatedCode)
    setCode(generatedCode)
    setMode('manual')
  }, [])
  const [running, setRunning] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [saveStatus, setSaveStatus] = React.useState(null) // 'saved' | 'error' | null
  const nodeEditorRef = React.useRef(null)
  const [nodeGenerating, setNodeGenerating] = React.useState(false)
  const [nodeGenStatus, setNodeGenStatus] = React.useState(null) // 'success' | 'error' | null
  const [promptModalOpen, setPromptModalOpen] = React.useState(false)
  const [promptText, setPromptText] = React.useState('')
  const [promptLoading, setPromptLoading] = React.useState(false)
  const [promptCopied, setPromptCopied] = React.useState(false)

  /* ── Test cases state ── */
  const [testCases, setTestCases] = React.useState([{ input: '', expectedOutput: '' }])

  const addTestCase = () => setTestCases((prev) => [...prev, { input: '', expectedOutput: '' }])
  const removeTestCase = (idx) => setTestCases((prev) => prev.filter((_, i) => i !== idx))
  const updateTestCase = (idx, field, value) =>
    setTestCases((prev) => prev.map((tc, i) => (i === idx ? { ...tc, [field]: value } : tc)))

  /* Initialise language & code from project */
  React.useEffect(() => {
    if (project) {
      const lang = project.language?.toLowerCase() === 'c++' ? 'cpp' : (project.language?.toLowerCase() || 'java')
      setLanguage(lang)
      // Load saved user code if available, otherwise use template
      if (project.userCode) {
        setCode(project.userCode)
      } else {
        setCode(templates[lang] || templates.java)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

  /* ── Save code to backend ── */
  const saveCode = async (codeToSave) => {
    if (!id || !user) return
    setSaving(true)
    setSaveStatus(null)
    const result = await saveCodeToStore(id, codeToSave ?? (mode === 'manual' ? code : nodeCode))
    if (result.ok) {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } else {
      console.error('Save error:', result.error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    }
    setSaving(false)
  }

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

  /* ── Resizable vertical split (editor / results) ── */
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

  /* ── Save generated prompt to DB ── */
  const handlePromptGenerated = React.useCallback(async (prompt) => {
    if (!id || !prompt) return
    const result = await saveGeneratedPromptToStore(id, prompt)
    if (!result.ok) console.error('Failed to save generated prompt:', result.error)
  }, [id, saveGeneratedPromptToStore])

  /* ── Generate code from node structure ── */
  const handleNodeGenerate = async () => {
    if (!nodeEditorRef.current?.triggerGenerate) return
    setNodeGenerating(true)
    setNodeGenStatus(null)
    try {
      await nodeEditorRef.current.triggerGenerate()
      setNodeGenStatus('success')
      setTimeout(() => setNodeGenStatus(null), 3000)
    } catch {
      setNodeGenStatus('error')
      setTimeout(() => setNodeGenStatus(null), 3000)
    } finally {
      setNodeGenerating(false)
    }
  }

  /* ── Get raw prompt for external use ── */
  const handleGetPrompt = async () => {
    if (!nodeEditorRef.current?.triggerGetPrompt) return
    setPromptLoading(true)
    try {
      const prompt = await nodeEditorRef.current.triggerGetPrompt()
      if (prompt) {
        setPromptText(prompt)
        setPromptModalOpen(true)
      }
    } catch {
      // ignore
    } finally {
      setPromptLoading(false)
    }
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(promptText).then(() => {
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2000)
    })
  }

  /* ── Run all test cases ── */
  const runTests = async () => {
    setRunning(true)
    setResults([])
    const sourceCode = mode === 'manual' ? code : nodeCode
    const allResults = []

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i]
      const result = await executeCode(languageId, sourceCode, tc.input || '')
      if (result.ok) {
        const passed = tc.expectedOutput.trim() !== '' && result.stdout === tc.expectedOutput.trim()
        allResults.push({ testIndex: i + 1, stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode, expected: tc.expectedOutput.trim(), passed })
      } else {
        allResults.push({ testIndex: i + 1, error: result.error, expected: tc.expectedOutput.trim(), passed: false })
      }
    }

    setResults(allResults)
    setRunning(false)
    // Only auto-save in manual code mode — node graph is saved via its own button
    if (mode === 'manual') saveCode(sourceCode)
  }

  /* ── Animation-once ref ── */
  const hasAnimated = React.useRef(false)
  React.useEffect(() => { hasAnimated.current = true }, [])

  /* ── Mobile tab state ── */
  const [mobileTab, setMobileTab] = React.useState('project')

  /* ── Loading / auth guards ── */
  if (!user) return <div className="h-screen flex items-center justify-center text-white/60">Not authenticated</div>

  if (!pageReady || storeLoading) {
    return (
      <AnimatePresence>
        <LoadingScreen />
      </AnimatePresence>
    )
  }

  if (!project) return <div className="h-screen flex items-center justify-center text-white/60">Project not found</div>

  /* ── Project info + test cases panel ── */
  const ProjectPanel = () => (
    <motion.div
      className="h-full overflow-y-auto p-4 md:p-5 custom-scrollbar bg-black/50"
      initial={hasAnimated.current ? false : 'hidden'}
      animate="visible"
      variants={fadeSide}
    >
      {/* Project header */}
      <motion.div className="flex items-center gap-3 mb-1" variants={hasAnimated.current ? undefined : fadeUp} custom={0}>
        <h2 className="text-lg font-semibold text-white/90">{project.title}</h2>
        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase font-medium">
          {project.language || 'JAVA'}
        </span>
      </motion.div>
      <motion.p className="text-sm text-white/60 mb-5 leading-relaxed" variants={hasAnimated.current ? undefined : fadeUp} custom={1}>
        {project.description || 'No description provided.'}
      </motion.p>

      {/* Test cases */}
      <motion.div variants={hasAnimated.current ? undefined : fadeUp} custom={2}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Test Cases</h3>
          <button
            onClick={addTestCase}
            className="text-[10px] px-2 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white font-medium transition"
          >
            + Add Test
          </button>
        </div>

        <AnimatePresence>
          {testCases.map((tc, i) => (
            <motion.div
              key={i}
              className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/50 uppercase font-medium">Test #{i + 1}</span>
                {testCases.length > 1 && (
                  <button
                    onClick={() => removeTestCase(i)}
                    className="text-[10px] text-red-400 hover:text-red-300 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
              <label className="block text-[10px] text-white/40 mb-1">Input</label>
              <textarea
                value={tc.input}
                onChange={(e) => updateTestCase(i, 'input', e.target.value)}
                placeholder="Enter input..."
                rows={2}
                className="w-full rounded-md px-2 py-1.5 text-xs bg-black/60 text-white/80 border border-white/10 placeholder-white/20 focus:border-blue-500/50 focus:outline-none resize-none font-mono"
              />
              <label className="block text-[10px] text-white/40 mt-2 mb-1">Expected Output</label>
              <textarea
                value={tc.expectedOutput}
                onChange={(e) => updateTestCase(i, 'expectedOutput', e.target.value)}
                placeholder="Enter expected output..."
                rows={2}
                className="w-full rounded-md px-2 py-1.5 text-xs bg-black/60 text-white/80 border border-white/10 placeholder-white/20 focus:border-blue-500/50 focus:outline-none resize-none font-mono"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )

  /* ── Editor toolbar (no stdin) ── */
  const Toolbar = () => (
    <motion.div
      className="flex items-center justify-between px-3 py-2 bg-black/30 border-b border-white/10 flex-wrap gap-2"
      initial={hasAnimated.current ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="rounded-md px-2 py-1 text-xs bg-black text-white border border-white/10">
          {language === 'cpp' ? 'C++' : language === 'java' ? 'Java' : language === 'python' ? 'Python' : 'JavaScript'}
        </span>
        <div className="inline-flex rounded-md bg-white/5 p-0.5">
          <button
            onClick={() => setMode('manual')}
            className={`px-2.5 py-1 text-xs rounded-md transition ${mode === 'manual' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/70'}`}
          >
            Code
          </button>
          <button
            onClick={() => setMode('nodes')}
            className={`px-2.5 py-1 text-xs rounded-md transition ${mode === 'nodes' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white/70'}`}
          >
            Nodes
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {mode === 'manual' && (
        <button
          onClick={() => saveCode()}
          disabled={saving}
          className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/70 hover:text-white px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 border border-white/10"
        >
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
        )}
        {mode === 'nodes' ? (
          <>
          <button
            onClick={handleGetPrompt}
            disabled={promptLoading}
            className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/70 hover:text-white px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 border border-white/10"
          >
            {promptLoading ? (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            Get Prompt
          </button>
          <button
            onClick={handleNodeGenerate}
            disabled={nodeGenerating}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5"
          >
            {nodeGenerating ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </span>
            ) : nodeGenStatus === 'success' ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Generated!
              </span>
            ) : nodeGenStatus === 'error' ? (
              <span>Failed — try again</span>
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
          <button
            onClick={runTests}
            disabled={running}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5"
          >
            {running ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running {testCases.length} test{testCases.length > 1 ? 's' : ''}...
              </span>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Run Tests
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  )

  /* ── Results panel with pass/fail per test ── */
  const ResultsPanel = () => (
    <motion.div
      className="h-full overflow-y-auto p-3 custom-scrollbar"
      initial={hasAnimated.current ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Test Results</h4>
        {results.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
            {results.filter((r) => r.passed).length}/{results.length} passed
          </span>
        )}
      </div>
      {results.length === 0 && <div className="text-xs text-white/30">Run your tests to see results here</div>}
      <AnimatePresence>
        {results.map((r, i) => (
          <motion.div
            key={i}
            className="mb-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-white/50 font-medium">Test #{r.testIndex}</span>
              {r.error ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Error</span>
              ) : r.passed ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Passed</span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  {r.expected ? 'Failed' : 'No expected output'}
                </span>
              )}
              {r.exitCode !== undefined && r.exitCode !== null && !r.error && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${r.exitCode === 0 ? 'bg-emerald-500/10 text-emerald-400/60' : 'bg-red-500/10 text-red-400/60'}`}>
                  exit: {r.exitCode}
                </span>
              )}
            </div>
            {r.error ? (
              <pre className="text-xs text-red-400 whitespace-pre-wrap">{r.error}</pre>
            ) : (
              <div className="space-y-1.5">
                {r.stdout ? (
                  <pre className="whitespace-pre-wrap text-xs text-white/80 bg-white/5 p-2 rounded-lg border border-white/10">{r.stdout}</pre>
                ) : (
                  <p className="text-xs text-white/30 italic">No output</p>
                )}
                {r.expected && (
                  <div className="text-[10px] text-white/40">
                    Expected: <span className="text-white/60 font-mono">{r.expected}</span>
                  </div>
                )}
                {r.stderr && (
                  <pre className="whitespace-pre-wrap text-xs text-red-300 bg-red-500/5 p-2 rounded-lg border border-red-500/10">{r.stderr}</pre>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )

  return (
    <>
      {/* ════════ MOBILE LAYOUT ════════ */}
      <div className="lg:hidden h-[calc(100vh-64px)] flex flex-col">
        <div className="flex bg-black/40 border-b border-white/10 shrink-0">
          {['project', 'editor', 'results'].map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition ${mobileTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-white/40'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden bg-black/20">
          {mobileTab === 'project' && ProjectPanel()}
          {mobileTab === 'editor' && (
            <div className="h-full flex flex-col">
              {Toolbar()}
              <motion.div className="flex-1" initial={hasAnimated.current ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div style={{ display: mode === 'manual' ? 'block' : 'none' }} className="h-full">
                  <CodeEditor language={language} value={code} onChange={(v) => setCode(v)} />
                </div>
                <div style={{ display: mode !== 'manual' ? 'block' : 'none' }} className="h-full">
                  <NodeEditor ref={nodeEditorRef} projectId={id} onCodeChange={handleNodeCodeChange} onPromptGenerated={handlePromptGenerated} />
                </div>
              </motion.div>
            </div>
          )}
          {mobileTab === 'results' && ResultsPanel()}
        </div>
      </div>

      {/* ════════ DESKTOP LAYOUT ════════ */}
      <div ref={containerRef} className="hidden lg:flex h-[calc(100vh-64px)] w-full">
        {/* ── Left: Project Info + Test Cases ── */}
        <motion.div
          style={{ width: `${leftWidth}%` }}
          className="h-full bg-black/20 border-r border-white/10 shrink-0 flex flex-col"
          initial={hasAnimated.current ? false : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="px-4 py-2.5 border-b border-white/10 bg-black/30">
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Project</span>
          </div>
          <div className="flex-1 overflow-hidden">
            {ProjectPanel()}
          </div>
        </motion.div>

        {/* ── Horizontal resize handle ── */}
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className="w-1 hover:w-1.5 bg-white/5 hover:bg-blue-500/40 cursor-col-resize transition-all shrink-0 active:bg-blue-500/60"
        />

        {/* ── Right: Editor + Results ── */}
        <motion.div
          ref={rightRef}
          className="flex-1 h-full flex flex-col min-w-0"
          initial={hasAnimated.current ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {Toolbar()}

          {/* Editor area */}
          <div style={{ height: `${editorHeight}%` }} className="shrink-0 overflow-hidden">
            <div style={{ display: mode === 'manual' ? 'block' : 'none' }} className="h-full">
              <CodeEditor language={language} value={code} onChange={(v) => setCode(v)} />
            </div>
            <div style={{ display: mode !== 'manual' ? 'block' : 'none' }} className="h-full">
              <NodeEditor ref={nodeEditorRef} projectId={id} onCodeChange={handleNodeCodeChange} onPromptGenerated={handlePromptGenerated} />
            </div>
          </div>

          {/* ── Vertical resize handle ── */}
          <div
            onMouseDown={onVMouseDown}
            onTouchStart={() => { vDragging.current = true }}
            className="h-1 hover:h-1.5 bg-white/5 hover:bg-blue-500/40 cursor-row-resize transition-all shrink-0 active:bg-blue-500/60"
          />

          {/* Results area */}
          <div className="flex-1 bg-black/20 border-t border-white/10 overflow-hidden">
            {ResultsPanel()}
          </div>
        </motion.div>
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
