import React, { useEffect, useRef, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import axios from 'axios'
import {
  User, Code2, BookOpen, FolderKanban, TrendingUp,
  CheckCircle2, Target, Flame, BarChart3, Lightbulb,
  ArrowRight, Calendar, Award, Zap, Brain,
  LogOut, Settings, Key, Eye, EyeOff, Trash2,
  Swords, Trophy, Shield, Crown, Star,
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useProblemStore from '../store/problemStore'
import useProjectStore from '../store/projectStore'
import useDSAProblemStore from '../store/dsaProblemStore'
import useArenaStore from '../store/arenaStore'

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */

/* localStorage solved set (same key as ProblemsListPage) */
function getSolvedSet() {
  try { return new Set(JSON.parse(localStorage.getItem('ntc_solved') || '[]')) }
  catch { return new Set() }
}

/* GSAP animated number */
function AnimNum({ to, duration = 1, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current, { innerText: 0 }, {
      innerText: to, duration, ease: 'power2.out', snap: { innerText: 1 },
      onUpdate() { ref.current.textContent = Math.round(gsap.getProperty(ref.current, 'innerText')) },
    })
  }, [to, duration])
  return <span ref={ref} className={className}>0</span>
}

/* ── SVG Donut Chart ── */
function DonutChart({ value, max, size = 100, stroke = 8, color = '#3b82f6', bgColor = 'rgba(255,255,255,0.05)', label, sublabel }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? value / max : 0
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bgColor} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
      {label && <div className="text-xs text-white/50 -mt-1">{label}</div>}
      {sublabel && <div className="text-[10px] text-white/30">{sublabel}</div>}
    </div>
  )
}

/* ── SVG Bar Chart ── */
function BarChart({ data, height = 120 }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-2 justify-center" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="flex flex-col items-center gap-1">
          <motion.div
            className="rounded-t-md"
            style={{ width: 28, background: d.color || '#3b82f6' }}
            initial={{ height: 0 }}
            animate={{ height: (d.value / maxVal) * (height - 24) }}
            transition={{ duration: 0.6, delay: 0.15 * i, ease: 'easeOut' }}
          />
          <span className="text-[9px] text-white/40">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ── SVG Radar / Skill Chart ── */
function RadarChart({ skills, size = 200 }) {
  const n = skills.length
  if (n < 3) return null
  const cx = size / 2, cy = size / 2, R = size / 2 - 20
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2

  const gridLevels = [0.25, 0.5, 0.75, 1]
  const pointStr = skills
    .map((s, i) => {
      const r = R * (s.value / 100)
      return `${cx + r * Math.cos(angle(i))},${cy + r * Math.sin(angle(i))}`
    })
    .join(' ')

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid */}
      {gridLevels.map((lv) => (
        <polygon
          key={lv}
          points={skills.map((_, i) => `${cx + R * lv * Math.cos(angle(i))},${cy + R * lv * Math.sin(angle(i))}`).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1}
        />
      ))}
      {/* Axes */}
      {skills.map((_, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={cx + R * Math.cos(angle(i))} y2={cy + R * Math.sin(angle(i))}
          stroke="rgba(255,255,255,0.06)" strokeWidth={1}
        />
      ))}
      {/* Data polygon */}
      <motion.polygon
        points={pointStr}
        fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth={2}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      {/* Dots + labels */}
      {skills.map((s, i) => {
        const r = R * (s.value / 100)
        const lx = cx + (R + 14) * Math.cos(angle(i))
        const ly = cy + (R + 14) * Math.sin(angle(i))
        return (
          <g key={s.label}>
            <motion.circle
              cx={cx + r * Math.cos(angle(i))} cy={cy + r * Math.sin(angle(i))}
              r={3} fill="#6366f1"
              initial={{ r: 0 }} animate={{ r: 3 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.05 }}
            />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
              fill="rgba(255,255,255,0.45)" fontSize={9} fontFamily="monospace">
              {s.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── Activity Heatmap (last 12 weeks) ── */
const WEEK_OPTIONS = [
  { label: '12w', value: 12 },
  { label: '24w', value: 24 },
  { label: '1y', value: 52 },
]
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function ActivityHeatmap({ solvedDates }) {
  const [weeks, setWeeks] = React.useState(12)
  const [tooltip, setTooltip] = React.useState(null)
  const animKey = React.useRef(0)

  // build grid
  const days = weeks * 7
  const today = new Date()
  const grid = React.useMemo(() => {
    const g = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      g.push({ date: new Date(d), key, count: solvedDates[key] || 0 })
    }
    return g
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeks, JSON.stringify(solvedDates)])

  const maxCount = Math.max(...grid.map((g) => g.count), 1)
  const totalSolved = grid.reduce((s, g) => s + g.count, 0)

  // month labels: find first day of each visible month
  const monthLabels = React.useMemo(() => {
    const labels = []
    let lastMonth = -1
    for (let w = 0; w < weeks; w++) {
      const cell = grid[w * 7]
      if (cell && cell.date.getMonth() !== lastMonth) {
        lastMonth = cell.date.getMonth()
        labels.push({ week: w, label: MONTH_SHORT[lastMonth] })
      }
    }
    return labels
  }, [grid, weeks])

  const cellSize = weeks > 30 ? 10 : 12
  const gap = weeks > 30 ? 2 : 3

  const handleWeekChange = (v) => {
    animKey.current += 1
    setWeeks(v)
  }

  return (
    <div>
      {/* Header row: range picker + summary */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/30 mr-1">{totalSolved} contributions</span>
        </div>
        <div className="inline-flex rounded-lg bg-white/5 p-0.5">
          {WEEK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleWeekChange(opt.value)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
                weeks === opt.value
                  ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid with labels */}
      <div className="overflow-x-auto pb-1 custom-scrollbar">
        <div className="inline-flex flex-col" style={{ minWidth: 'fit-content' }}>
          {/* Month labels row */}
          <div className="flex" style={{ paddingLeft: 28, gap, marginBottom: 4 }}>
            {Array.from({ length: weeks }).map((_, w) => {
              const ml = monthLabels.find((m) => m.week === w)
              return (
                <div key={w} style={{ width: cellSize, minWidth: cellSize }} className="text-[9px] text-white/25 leading-none">
                  {ml ? ml.label : ''}
                </div>
              )
            })}
          </div>

          {/* Day rows */}
          <div className="flex">
            {/* Day-of-week labels */}
            <div className="flex flex-col shrink-0 mr-1" style={{ gap, width: 24 }}>
              {DAY_LABELS.map((lbl, i) => (
                <div key={i} className="text-[9px] text-white/20 text-right pr-1 leading-none flex items-center justify-end" style={{ height: cellSize }}>
                  {lbl}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div key={animKey.current} className="flex" style={{ gap }}>
              {Array.from({ length: weeks }).map((_, w) => (
                <div key={w} className="flex flex-col" style={{ gap }}>
                  {Array.from({ length: 7 }).map((_, d) => {
                    const cell = grid[w * 7 + d]
                    if (!cell) return <div key={d} style={{ width: cellSize, height: cellSize }} />
                    const intensity = cell.count > 0 ? 0.2 + 0.8 * (cell.count / maxCount) : 0
                    return (
                      <motion.div
                        key={d}
                        className="rounded-[2px] cursor-pointer relative"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: cell.count > 0
                            ? `rgba(99,102,241,${intensity})`
                            : 'rgba(255,255,255,0.04)',
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.15, delay: (w * 7 + d) * 0.002 }}
                        onMouseEnter={() => setTooltip({ w, d, cell })}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="mt-2 text-[10px] text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <span className="text-white/70 font-medium">{tooltip.cell.key}</span>
            {' — '}
            <span className={tooltip.cell.count > 0 ? 'text-indigo-400' : ''}>
              {tooltip.cell.count > 0 ? `${tooltip.cell.count} solved` : 'No activity'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3 text-[9px] text-white/25">
        <span>Less</span>
        {[0.05, 0.2, 0.4, 0.7, 1].map((op) => (
          <div key={op} className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: `rgba(99,102,241,${op})` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   SUGGESTED TOPICS
   ═══════════════════════════════════════ */
const TOPICS = [
  { title: 'Arrays & Hashing', Icon: BarChart3, color: 'from-blue-500/20 to-blue-600/10', difficulty: 'Easy-Medium' },
  { title: 'Two Pointers', Icon: Target, color: 'from-emerald-500/20 to-emerald-600/10', difficulty: 'Easy-Medium' },
  { title: 'Sliding Window', Icon: Zap, color: 'from-amber-500/20 to-amber-600/10', difficulty: 'Medium' },
  { title: 'Binary Search', Icon: TrendingUp, color: 'from-purple-500/20 to-purple-600/10', difficulty: 'Medium' },
  { title: 'Linked Lists', Icon: Code2, color: 'from-pink-500/20 to-pink-600/10', difficulty: 'Easy-Medium' },
  { title: 'Trees & Graphs', Icon: Brain, color: 'from-green-500/20 to-green-600/10', difficulty: 'Medium-Hard' },
  { title: 'Dynamic Programming', Icon: Flame, color: 'from-red-500/20 to-red-600/10', difficulty: 'Hard' },
  { title: 'Backtracking', Icon: ArrowRight, color: 'from-indigo-500/20 to-indigo-600/10', difficulty: 'Medium-Hard' },
  { title: 'Greedy Algorithms', Icon: Award, color: 'from-teal-500/20 to-teal-600/10', difficulty: 'Medium' },
  { title: 'Stack & Queue', Icon: BookOpen, color: 'from-cyan-500/20 to-cyan-600/10', difficulty: 'Easy-Medium' },
]

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const problems = useProblemStore((s) => s.problemsList)
  const fetchProblems = useProblemStore((s) => s.fetchProblems)
  const projects = useProjectStore((s) => s.projects)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const dsaProblems = useDSAProblemStore((s) => s.dsaProblemsList)
  const fetchDSAProblems = useDSAProblemStore((s) => s.fetchDSAProblems)
  const arenaStats = useArenaStore((s) => s.stats)
  const fetchArenaStats = useArenaStore((s) => s.fetchStats)
  const arenaHistory = useArenaStore((s) => s.history)
  const fetchArenaHistory = useArenaStore((s) => s.fetchHistory)

  const [dsaSolvedIds, setDsaSolvedIds] = useState(new Set())

  const headerRef = useRef(null)

  useEffect(() => {
    fetchProblems()
    fetchProjects()
    fetchDSAProblems()
    fetchArenaStats()
    fetchArenaHistory()
    // Fetch DSA solved IDs from backend
    axios.get('http://localhost:8080/api/dsa-submissions/solved', { withCredentials: true })
      .then((res) => setDsaSolvedIds(new Set((res.data || []).map(String))))
      .catch(() => setDsaSolvedIds(new Set()))
  }, [fetchProblems, fetchProjects, fetchDSAProblems, fetchArenaStats, fetchArenaHistory])

  useEffect(() => {
    if (!headerRef.current) return
    gsap.fromTo(headerRef.current.children,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out' }
    )
  }, [])

  const solved = useMemo(() => getSolvedSet(), [])

  /* ── Design Pattern stats ── */
  const dpStats = useMemo(() => {
    const total = problems.length
    const solvedCount = problems.filter((p) => solved.has(p.id)).length
    const easy = problems.filter((p) => p.difficulty?.toLowerCase() === 'easy')
    const med = problems.filter((p) => p.difficulty?.toLowerCase() === 'medium')
    const hard = problems.filter((p) => p.difficulty?.toLowerCase() === 'hard')
    const solvedEasy = easy.filter((p) => solved.has(p.id)).length
    const solvedMed = med.filter((p) => solved.has(p.id)).length
    const solvedHard = hard.filter((p) => solved.has(p.id)).length
    return {
      total, solvedCount,
      easy: easy.length, med: med.length, hard: hard.length,
      solvedEasy, solvedMed, solvedHard,
    }
  }, [problems, solved])

  /* ── DSA stats ── */
  const dsaStats = useMemo(() => {
    const total = dsaProblems.length
    const solvedCount = dsaProblems.filter((p) => dsaSolvedIds.has(String(p.id))).length
    const easy = dsaProblems.filter((p) => p.difficulty?.toLowerCase() === 'easy')
    const med = dsaProblems.filter((p) => p.difficulty?.toLowerCase() === 'medium')
    const hard = dsaProblems.filter((p) => p.difficulty?.toLowerCase() === 'hard')
    const solvedEasy = easy.filter((p) => dsaSolvedIds.has(String(p.id))).length
    const solvedMed = med.filter((p) => dsaSolvedIds.has(String(p.id))).length
    const solvedHard = hard.filter((p) => dsaSolvedIds.has(String(p.id))).length
    return {
      total, solvedCount,
      easy: easy.length, med: med.length, hard: hard.length,
      solvedEasy, solvedMed, solvedHard,
    }
  }, [dsaProblems, dsaSolvedIds])

  /* ── Combined stats (used as the displayed total) ── */
  const stats = useMemo(() => {
    const total = dpStats.total + dsaStats.total
    const solvedCount = dpStats.solvedCount + dsaStats.solvedCount
    return {
      total, solvedCount,
      easy: dpStats.easy + dsaStats.easy,
      med: dpStats.med + dsaStats.med,
      hard: dpStats.hard + dsaStats.hard,
      solvedEasy: dpStats.solvedEasy + dsaStats.solvedEasy,
      solvedMed: dpStats.solvedMed + dsaStats.solvedMed,
      solvedHard: dpStats.solvedHard + dsaStats.solvedHard,
    }
  }, [dpStats, dsaStats])

  /* ── Language breakdown for projects ── */
  const langStats = useMemo(() => {
    const m = {}
    projects.forEach((p) => {
      const l = (p.language || 'java').toLowerCase()
      m[l] = (m[l] || 0) + 1
    })
    return Object.entries(m).map(([lang, count]) => ({ lang, count }))
  }, [projects])

  /* ── Skill radar data (derived from solved problems) ── */
  const skills = useMemo(() => {
    const pct = stats.total ? (stats.solvedCount / stats.total) * 100 : 0
    const ePct = stats.easy ? (stats.solvedEasy / stats.easy) * 100 : 0
    const mPct = stats.med ? (stats.solvedMed / stats.med) * 100 : 0
    const hPct = stats.hard ? (stats.solvedHard / stats.hard) * 100 : 0
    return [
      { label: 'Logic', value: Math.min(Math.round(pct * 1.1), 100) },
      { label: 'Easy', value: Math.round(ePct) },
      { label: 'Medium', value: Math.round(mPct) },
      { label: 'Hard', value: Math.round(hPct) },
      { label: 'Projects', value: Math.min(projects.length * 15, 100) },
      { label: 'Consistency', value: Math.min(stats.solvedCount * 8, 100) },
    ]
  }, [stats, projects])

  /* ── Fake activity heatmap (based on localStorage entries) ── */
  const solvedDates = useMemo(() => {
    // Generate simulated dates; in a real app you would store timestamps
    const dates = {}
    const today = new Date()
    const s = [...solved]
    s.forEach((id, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - Math.floor(Math.random() * 84))
      const key = d.toISOString().slice(0, 10)
      dates[key] = (dates[key] || 0) + 1
    })
    return dates
  }, [solved])

  /* ── Bar chart data (difficulty) ── */
  const barData = [
    { label: 'Easy', value: stats.solvedEasy, color: '#10b981' },
    { label: 'Med', value: stats.solvedMed, color: '#f59e0b' },
    { label: 'Hard', value: stats.solvedHard, color: '#ef4444' },
  ]

  /* ── Suggested topics (smart pick) ── */
  const suggestedTopics = useMemo(() => {
    // Shuffle and pick 6
    const shuffled = [...TOPICS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 6)
  }, [])

  const pct = stats.total ? Math.round((stats.solvedCount / stats.total) * 100) : 0
  const dpPct = dpStats.total ? Math.round((dpStats.solvedCount / dpStats.total) * 100) : 0
  const dsaPct = dsaStats.total ? Math.round((dsaStats.solvedCount / dsaStats.total) * 100) : 0

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const [hoveredCard, setHoveredCard] = useState(null)

  /* ── API Key Settings state ── */
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeyStatus, setApiKeyStatus] = useState({ hasApiKey: false, maskedKey: '' })
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [apiKeySaveStatus, setApiKeySaveStatus] = useState(null) // 'saved' | 'error' | 'removed' | null
  const [showApiKey, setShowApiKey] = useState(false)
  const getApiKeyStatus = useAuthStore((s) => s.getApiKeyStatus)
  const updateApiKey = useAuthStore((s) => s.updateApiKey)
  const removeApiKey = useAuthStore((s) => s.removeApiKey)

  useEffect(() => {
    // Fetch API key status on mount
    getApiKeyStatus().then(setApiKeyStatus)
  }, [getApiKeyStatus])

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return
    setApiKeyLoading(true)
    setApiKeySaveStatus(null)
    const result = await updateApiKey(apiKeyInput.trim())
    if (result.ok) {
      setApiKeySaveStatus('saved')
      setApiKeyInput('')
      getApiKeyStatus().then(setApiKeyStatus)
      setTimeout(() => setApiKeySaveStatus(null), 3000)
    } else {
      setApiKeySaveStatus('error')
      setTimeout(() => setApiKeySaveStatus(null), 3000)
    }
    setApiKeyLoading(false)
  }

  const handleRemoveApiKey = async () => {
    setApiKeyLoading(true)
    setApiKeySaveStatus(null)
    const result = await removeApiKey()
    if (result.ok) {
      setApiKeySaveStatus('removed')
      setApiKeyStatus({ hasApiKey: false, maskedKey: '' })
      setTimeout(() => setApiKeySaveStatus(null), 3000)
    } else {
      setApiKeySaveStatus('error')
      setTimeout(() => setApiKeySaveStatus(null), 3000)
    }
    setApiKeyLoading(false)
  }

  const stagger = { visible: { transition: { staggerChildren: 0.06 } } }
  const fadeUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-600 via-black to-purple-600">
      <div className="min-h-screen bg-black/40 backdrop-blur-sm text-white overflow-x-hidden">
        <div className="px-4 sm:px-6 md:px-10 lg:px-16 py-8 max-w-7xl mx-auto pb-28">

          {/* ════════════ HEADER ════════════ */}
          <div ref={headerRef} className="mb-10">
            {/* Avatar card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold shadow-xl shadow-blue-500/20">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black" title="Online" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user?.name || 'User'}</h1>
                <p className="text-sm text-white/40 mt-0.5">{user?.email || 'No email'}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/20 font-medium">
                    <Award size={10} className="inline mr-1 -mt-px" />
                    {stats.solvedCount >= 10 ? 'Experienced' : stats.solvedCount >= 5 ? 'Intermediate' : 'Beginner'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/20 font-medium">
                    <Zap size={10} className="inline mr-1 -mt-px" />
                    {projects.length} Project{projects.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white/50 hover:text-red-400 hover:border-red-500/20 transition"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>

          {/* ════════════ STAT CARDS ════════════ */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8"
            initial="hidden" animate="visible" variants={stagger}
          >
            {[
              {
                icon: Target, label: 'Progress', value: `${pct}%`, color: 'text-blue-400',
                tooltip: (
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] text-indigo-400 font-medium">DSA</span>
                      <span className="text-[10px] text-white/60">{dsaPct}% <span className="text-white/30">({dsaStats.solvedCount}/{dsaStats.total})</span></span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] text-purple-400 font-medium">Design Patterns</span>
                      <span className="text-[10px] text-white/60">{dpPct}% <span className="text-white/30">({dpStats.solvedCount}/{dpStats.total})</span></span>
                    </div>
                  </div>
                ),
              },
              {
                icon: CheckCircle2, label: 'Solved', value: `${stats.solvedCount}/${stats.total}`, color: 'text-emerald-400',
                tooltip: (
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] text-indigo-400 font-medium">DSA</span>
                      <span className="text-[10px] text-white/60">{dsaStats.solvedCount}<span className="text-white/30">/{dsaStats.total}</span></span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] text-purple-400 font-medium">Design Patterns</span>
                      <span className="text-[10px] text-white/60">{dpStats.solvedCount}<span className="text-white/30">/{dpStats.total}</span></span>
                    </div>
                  </div>
                ),
              },
              { icon: FolderKanban, label: 'Projects', value: projects.length, color: 'text-purple-400' },
              {
                icon: Flame, label: 'Streak', value: `${Math.min(stats.solvedCount, 7)}d`, color: 'text-amber-400',
                tooltip: (
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] text-indigo-400 font-medium">DSA</span>
                      <span className="text-[10px] text-white/60">{dsaStats.solvedCount} solved</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] text-purple-400 font-medium">Design Patterns</span>
                      <span className="text-[10px] text-white/60">{dpStats.solvedCount} solved</span>
                    </div>
                  </div>
                ),
              },
            ].map((s, idx) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 relative cursor-default"
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <s.icon size={13} className={s.color} /> {s.label}
                </div>
                <div className="text-xl font-bold">{s.value}</div>
                {s.tooltip && (
                  <AnimatePresence>
                    {hoveredCard === idx && (
                      <motion.div
                        className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-black/90 border border-white/10 rounded-xl px-3 py-2.5 shadow-xl shadow-black/60"
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="text-[10px] text-white/30 font-medium mb-1.5 uppercase tracking-wider">Breakdown</div>
                        {s.tooltip}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* ════════════ CHARTS ROW ════════════ */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            initial="hidden" animate="visible" variants={stagger}
          >
            {/* Donut: Overall progress */}
            <motion.div variants={fadeUp}
              className="bg-black/60 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-4">
              <h3 className="text-xs text-white/40 uppercase tracking-wider self-start flex items-center gap-2">
                <Target size={12} /> Overall Completion
              </h3>
              <DonutChart value={stats.solvedCount} max={stats.total} size={120} stroke={10}
                color="#6366f1" label={`${pct}%`} sublabel={`${stats.solvedCount} of ${stats.total}`} />
            </motion.div>

            {/* Bar: Difficulty breakdown */}
            <motion.div variants={fadeUp}
              className="bg-black/60 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={12} /> Difficulty Solved
              </h3>
              <BarChart data={barData} height={110} />
              <div className="flex items-center justify-center gap-4 text-[10px] text-white/30">
                {barData.map((d) => (
                  <span key={d.label} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    {d.label}: {d.value}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Donut: per-language projects */}
            <motion.div variants={fadeUp}
              className="bg-black/60 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2">
                <Code2 size={12} /> Projects by Language
              </h3>
              {langStats.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-white/20">No projects yet</div>
              ) : (
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  {langStats.map((ls) => {
                    const colors = { java: '#f97316', python: '#eab308', cpp: '#3b82f6', javascript: '#10b981' }
                    return (
                      <DonutChart
                        key={ls.lang}
                        value={ls.count} max={projects.length}
                        size={70} stroke={6}
                        color={colors[ls.lang] || '#6366f1'}
                        label={ls.lang.toUpperCase()}
                        sublabel={`${ls.count}`}
                      />
                    )
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* ════════════ SKILL RADAR + ACTIVITY ════════════ */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
            initial="hidden" animate="visible" variants={stagger}
          >
            {/* Radar */}
            <motion.div variants={fadeUp}
              className="bg-black/60 border border-white/10 rounded-2xl p-5">
              <h3 className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Brain size={12} /> Skill Radar
              </h3>
              <RadarChart skills={skills} size={220} />
            </motion.div>

            {/* Activity Heatmap */}
            <motion.div variants={fadeUp}
              className="bg-black/60 border border-white/10 rounded-2xl p-5">
              <h3 className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Calendar size={12} /> Activity
              </h3>
              <ActivityHeatmap solvedDates={solvedDates} />
            </motion.div>
          </motion.div>

          {/* ════════════ DIFFICULTY PROGRESS BARS ════════════ */}
          <motion.div
            className="bg-black/60 border border-white/10 rounded-2xl p-5 mb-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2 mb-5">
              <TrendingUp size={12} /> Difficulty Progress
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Easy', solved: stats.solvedEasy, total: stats.easy, color: '#10b981', bg: 'bg-emerald-500' },
                { label: 'Medium', solved: stats.solvedMed, total: stats.med, color: '#f59e0b', bg: 'bg-amber-500' },
                { label: 'Hard', solved: stats.solvedHard, total: stats.hard, color: '#ef4444', bg: 'bg-red-500' },
              ].map((d) => {
                const p = d.total > 0 ? Math.round((d.solved / d.total) * 100) : 0
                return (
                  <div key={d.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium" style={{ color: d.color }}>{d.label}</span>
                      <span className="text-[10px] text-white/30">{d.solved}/{d.total} ({p}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${d.bg}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${p}%` }}
                        transition={{ duration: 0.9, delay: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* ════════════ SUGGESTED TOPICS ════════════ */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <h3 className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Lightbulb size={12} /> Suggested Topics for Practice
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestedTopics.map((topic, i) => (
                <motion.div
                  key={topic.title}
                  className={`bg-gradient-to-br ${topic.color} border border-white/[0.06] rounded-2xl p-4 flex items-start gap-3 hover:border-white/15 transition-all cursor-pointer group`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <topic.Icon size={20} className="shrink-0 mt-0.5 text-white/50" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white/85 group-hover:text-white transition">{topic.title}</h4>
                    <p className="text-[10px] text-white/30 mt-0.5">{topic.difficulty}</p>
                  </div>
                  <ArrowRight size={14} className="text-white/15 group-hover:text-white/40 transition shrink-0 mt-1" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ════════════ ARENA STATS ════════════ */}
          {arenaStats && (
            <motion.div
              className="bg-black/60 border border-white/10 rounded-2xl p-5 mb-8"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36 }}
            >
              <h3 className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2 mb-5">
                <Swords size={12} /> Arena Performance
              </h3>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                {[
                  { label: 'Tests', value: arenaStats.totalTests, icon: Target, color: '#6366f1' },
                  { label: 'Best Score', value: arenaStats.bestScore, icon: Trophy, color: '#fbbf24' },
                  { label: 'Avg Score', value: arenaStats.avgScore, icon: TrendingUp, color: '#3b82f6' },
                  { label: 'Total XP', value: arenaStats.totalScore, icon: Zap, color: '#10b981' },
                  { label: 'Streak', value: `${arenaStats.streak}🔥`, icon: Flame, color: '#ef4444' },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <s.icon size={16} className="mx-auto mb-1.5" style={{ color: s.color }} />
                    <div className="text-lg font-bold font-mono">{s.value}</div>
                    <div className="text-[9px] text-white/30 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Badges row */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {[
                  { label: 'Platinum', count: arenaStats.platinum, icon: Crown, color: '#e5e7eb' },
                  { label: 'Gold', count: arenaStats.gold, icon: Trophy, color: '#fbbf24' },
                  { label: 'Silver', count: arenaStats.silver, icon: Award, color: '#94a3b8' },
                  { label: 'Bronze', count: arenaStats.bronze, icon: Star, color: '#d97706' },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5 text-xs">
                    <b.icon size={14} style={{ color: b.color }} />
                    <span style={{ color: b.color }}>{b.count}</span>
                    <span className="text-white/25">{b.label}</span>
                  </div>
                ))}
              </div>

              {/* Recent tests */}
              {arenaHistory.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/5">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Recent Tests</div>
                  <div className="space-y-1.5">
                    {arenaHistory.slice(0, 3).map((t) => {
                      const badgeColors = { PLATINUM: '#e5e7eb', GOLD: '#fbbf24', SILVER: '#94a3b8', BRONZE: '#d97706', NONE: '#64748b' }
                      const modeLabels = { RANDOM_CHALLENGE: 'Random', SPRINT_TEST: 'Sprint', FULL_TEST: 'Full' }
                      return (
                        <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <div className="flex items-center gap-2">
                            <Swords size={12} className="text-white/20" />
                            <span className="text-xs text-white/60">{modeLabels[t.mode] || t.mode}</span>
                            <span className="text-[10px] text-white/20">{t.solvedCount}/{t.totalProblems}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold" style={{ color: badgeColors[t.badge] || '#64748b' }}>{t.score}</span>
                            <span className="text-[9px] uppercase" style={{ color: badgeColors[t.badge] || '#64748b' }}>{t.badge}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <Link
                    to="/arena"
                    className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Go to Arena <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════ AI SETTINGS ════════════ */}
          <motion.div
            className="bg-black/60 border border-white/10 rounded-2xl p-5 mb-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
          >
            <h3 className="text-xs text-white/40 uppercase tracking-wider flex items-center gap-2 mb-5">
              <Settings size={12} /> AI Settings
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/70 mb-1 flex items-center gap-2">
                  <Key size={14} className="text-amber-400" />
                  Gemini API Key
                </p>
                <p className="text-[11px] text-white/30 mb-3">
                  Add your own Google Gemini API key to generate code from node graphs.
                  If you don't provide one, the platform's default key will be used.
                  Get a free key at{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                    Google AI Studio
                  </a>.
                </p>

                {/* Current key status */}
                {apiKeyStatus.hasApiKey && (
                  <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-emerald-400 font-medium">Personal key active</span>
                      <span className="text-[11px] text-white/30 ml-2 font-mono">{apiKeyStatus.maskedKey}</span>
                    </div>
                    <button
                      onClick={handleRemoveApiKey}
                      disabled={apiKeyLoading}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition disabled:opacity-50"
                    >
                      <Trash2 size={10} /> Remove
                    </button>
                  </div>
                )}

                {/* Input field */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={apiKeyStatus.hasApiKey ? 'Enter new key to replace...' : 'Enter your Gemini API key...'}
                      className="w-full rounded-lg px-3 py-2 pr-9 text-xs bg-black/60 text-white/80 border border-white/10 placeholder-white/20 focus:border-blue-500/50 focus:outline-none font-mono transition"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                    >
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={handleSaveApiKey}
                    disabled={apiKeyLoading || !apiKeyInput.trim()}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition flex items-center gap-1.5"
                  >
                    {apiKeyLoading ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    ) : (
                      <Key size={12} />
                    )}
                    {apiKeyStatus.hasApiKey ? 'Update' : 'Save'}
                  </button>
                </div>

                {/* Status feedback */}
                <AnimatePresence>
                  {apiKeySaveStatus && (
                    <motion.div
                      className={`mt-2 text-[11px] flex items-center gap-1.5 ${
                        apiKeySaveStatus === 'saved' ? 'text-emerald-400' :
                        apiKeySaveStatus === 'removed' ? 'text-amber-400' :
                        'text-red-400'
                      }`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                    >
                      {apiKeySaveStatus === 'saved' && <><CheckCircle2 size={12} /> API key saved successfully</>}
                      {apiKeySaveStatus === 'removed' && <><Trash2 size={12} /> API key removed — using default key</>}
                      {apiKeySaveStatus === 'error' && <>Failed to update API key</>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ════════════ QUICK LINKS ════════════ */}
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { to: '/problems', label: 'All Problems', icon: BookOpen },
              { to: '/arena', label: 'Arena', icon: Swords },
              { to: '/projects', label: 'My Projects', icon: FolderKanban },
              { to: '/dashboard', label: 'Dashboard', icon: TrendingUp },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 hover:text-white hover:border-white/15 transition"
              >
                <link.icon size={14} />
                {link.label}
              </Link>
            ))}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
