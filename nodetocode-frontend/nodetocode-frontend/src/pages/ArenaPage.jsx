import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import {
  Swords, Zap, Timer, Trophy, Star, Flame, Target, ArrowRight,
  ChevronLeft, CheckCircle2, XCircle, Clock, Award, TrendingUp,
  Play, Shield, Crown, Sparkles, RotateCcw, AlertCircle, Loader2,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import useArenaStore from '../store/arenaStore'
import useDSAProblemStore from '../store/dsaProblemStore'
import useAuthStore from '../store/authStore'
import axios from 'axios'

/* ═══════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════ */
const TEST_MODES = [
  {
    key: 'RANDOM_CHALLENGE',
    title: 'Random Challenge',
    subtitle: 'Quick Fire',
    description: 'Solve 1 random DSA problem in 15–30 minutes depending on difficulty.',
    problems: 1,
    time: '15–30 min',
    icon: Zap,
    gradient: 'from-amber-500/20 via-orange-500/15 to-red-500/10',
    border: 'border-amber-500/20',
    accent: '#f59e0b',
    glow: 'shadow-amber-500/10',
    difficulty: 'Varies',
  },
  {
    key: 'SPRINT_TEST',
    title: 'Sprint Test',
    subtitle: 'Speed Run',
    description: 'Solve 2 problems in 1 hour. A balanced mix of difficulties.',
    problems: 2,
    time: '60 min',
    icon: Flame,
    gradient: 'from-blue-500/20 via-indigo-500/15 to-purple-500/10',
    border: 'border-blue-500/20',
    accent: '#3b82f6',
    glow: 'shadow-blue-500/10',
    difficulty: 'Mixed',
  },
  {
    key: 'FULL_TEST',
    title: 'Full Test',
    subtitle: 'Endurance',
    description: 'Solve 4 problems in 2 hours. Comprehensive challenge across all levels.',
    problems: 4,
    time: '120 min',
    icon: Shield,
    gradient: 'from-purple-500/20 via-pink-500/15 to-red-500/10',
    border: 'border-purple-500/20',
    accent: '#a855f7',
    glow: 'shadow-purple-500/10',
    difficulty: 'E → H',
  },
]

const BADGE_CONFIG = {
  PLATINUM: { label: 'Platinum', color: '#e5e7eb', bg: 'from-slate-300/20 to-slate-400/10', icon: Crown },
  GOLD: { label: 'Gold', color: '#fbbf24', bg: 'from-amber-400/20 to-yellow-500/10', icon: Trophy },
  SILVER: { label: 'Silver', color: '#94a3b8', bg: 'from-slate-400/20 to-slate-500/10', icon: Award },
  BRONZE: { label: 'Bronze', color: '#d97706', bg: 'from-orange-600/20 to-amber-700/10', icon: Star },
  NONE: { label: 'No Badge', color: '#64748b', bg: 'from-slate-600/20 to-slate-700/10', icon: Target },
}

/* ═══════════════════════════════════════
   CARD BORDER HOVER EFFECTS
   ═══════════════════════════════════════ */

/*
 * SVG stroke on a <rect> lives exactly ON the border path — it cannot leak
 * into the card interior. strokeDashoffset moves continuously across 3 laps
 * (0 → -P → -2P → -3P) so there is no wrap-at-1 glitch.
 */

/* ── Sprint border: single continuous ease — NO intermediate keyframes ── */
function SprintBorderEffect({ hovered }) {
  const rectRef = useRef(null)
  const [P, setP] = useState(920) // fallback perimeter; updated on mount

  useEffect(() => {
    if (rectRef.current?.getTotalLength) {
      setP(rectRef.current.getTotalLength())
    }
  }, [])

  const off = { duration: 0.2 }
  const totalDuration = 2.2
  // Single cubic-bezier: very slow start → furiously fast finish — no stops
  // x1=0.55, y1=0 (gentle start), x2=0.98, y2=1 (explosive end)
  const accelEase = [0.55, 0, 0.98, 1]

  const leadLen = P * 0.09
  const trailLen = P * 0.20

  return (
    <div className="absolute inset-0 pointer-events-none z-[1]">
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="st-border-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* cyan leading tip — one shot: 0 → -3P, no intermediate stops */}
        <motion.rect
          ref={rectRef}
          x="1.5" y="1.5" width="99%" height="99%" rx="15"
          fill="none" stroke="#bae6fd" strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          filter="url(#st-border-glow)"
          strokeDasharray={`${leadLen} ${P - leadLen}`}
          initial={false}
          animate={hovered
            ? { strokeDashoffset: -P * 3, opacity: 1 }
            : { strokeDashoffset: 0, opacity: 0 }}
          transition={hovered
            ? { strokeDashoffset: { duration: totalDuration, ease: accelEase }, opacity: { duration: 0.1 } }
            : off}
        />

        {/* wider blue glow trail */}
        <motion.rect
          x="1.5" y="1.5" width="99%" height="99%" rx="15"
          fill="none" stroke="#3b82f6" strokeWidth="7" strokeOpacity="0.28"
          vectorEffect="non-scaling-stroke"
          filter="url(#st-border-glow)"
          strokeDasharray={`${trailLen} ${P - trailLen}`}
          initial={false}
          animate={hovered
            ? { strokeDashoffset: -P * 3, opacity: 1 }
            : { strokeDashoffset: 0, opacity: 0 }}
          transition={hovered
            ? { strokeDashoffset: { duration: totalDuration, ease: accelEase }, opacity: { duration: 0.1 } }
            : off}
        />

        {/* full border lights up only after the run finishes */}
        <motion.rect
          x="1.5" y="1.5" width="99%" height="99%" rx="15"
          fill="none" stroke="#93c5fd" strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          filter="url(#st-border-glow)"
          initial={false}
          animate={hovered ? { pathLength: 1, opacity: [0, 0, 1] } : { opacity: 0 }}
          transition={hovered ? { duration: totalDuration + 0.2, times: [0, 0.9, 1] } : off}
        />
      </svg>

      {/* box-shadow bloom after run completes */}
      <motion.div
        initial={false}
        className="absolute inset-0 rounded-2xl"
        animate={hovered
          ? { opacity: [0, 0, 1], boxShadow: ['0 0 0px rgba(96,165,250,0)', '0 0 0px rgba(96,165,250,0)', '0 0 30px rgba(96,165,250,0.42)'] }
          : { opacity: 0, boxShadow: '0 0 0px rgba(96,165,250,0)' }}
        transition={hovered
          ? { duration: totalDuration + 0.25, times: [0, 0.9, 1], ease: 'easeOut' }
          : off}
      />
    </div>
  )
}

function ArenaCardBorderEffect({ modeKey, hovered }) {
  const off = { duration: 0.2 }

  /* ── Random Challenge: sparking yellow-orange beam that races the border ── */
  if (modeKey === 'RANDOM_CHALLENGE') {
    return (
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter id="rc-border-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* bright yellow leading dot */}
          <motion.rect
            x="1.5" y="1.5" width="99%" height="99%" rx="15"
            fill="none" stroke="#fde047" strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            filter="url(#rc-border-glow)"
            initial={false}
            animate={hovered
              ? { pathLength: 0.1, pathOffset: [0, 1], opacity: 1 }
              : { opacity: 0, pathOffset: 0 }}
            transition={hovered
              ? { pathOffset: { duration: 0.88, ease: 'easeOut' }, opacity: { duration: 0.1 } }
              : off}
          />
          {/* wider orange tail */}
          <motion.rect
            x="1.5" y="1.5" width="99%" height="99%" rx="15"
            fill="none" stroke="#f97316" strokeWidth="5" strokeOpacity="0.4"
            vectorEffect="non-scaling-stroke"
            filter="url(#rc-border-glow)"
            initial={false}
            animate={hovered
              ? { pathLength: 0.24, pathOffset: [0, 1], opacity: 1 }
              : { opacity: 0, pathOffset: 0 }}
            transition={hovered
              ? { pathOffset: { duration: 0.88, ease: 'easeOut' }, opacity: { duration: 0.1 } }
              : off}
          />
          {/* lingering amber outline after sweep completes */}
          <motion.rect
            x="1.5" y="1.5" width="99%" height="99%" rx="15"
            fill="none" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.3"
            vectorEffect="non-scaling-stroke"
            initial={false}
            animate={hovered
              ? { pathLength: 1, opacity: [0, 0, 1] }
              : { opacity: 0 }}
            transition={hovered ? { duration: 1.05, times: [0, 0.7, 1] } : off}
          />
        </svg>

        {/* spark particles */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3.5 - i * 0.3,
              height: 3.5 - i * 0.3,
              top: `${6 + i * 8}%`,
              left: `${6 + i * 7}%`,
              background: i % 2 === 0 ? '#fde047' : '#fb923c',
              boxShadow: `0 0 5px 2px ${i % 2 === 0 ? 'rgba(253,224,71,0.9)' : 'rgba(249,115,22,0.8)'}`,
            }}
            initial={false}
            animate={hovered
              ? { x: [0, (i + 1) * 20], y: [0, i % 2 === 0 ? -18 : 14, 0], opacity: [0, 1, 0], scale: [0, 1.3, 0] }
              : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.55 + i * 0.065, delay: i * 0.05 }}
          />
        ))}
      </div>
    )
  }

  /* ── Sprint Test: delegated to SprintBorderEffect for continuous strokeDashoffset laps ── */
  if (modeKey === 'SPRINT_TEST') return <SprintBorderEffect hovered={hovered} />

  /* ── Full Test: radiating purple → white light emission ── */
  return (
    <div className="absolute pointer-events-none z-[1]" style={{ inset: '-4px', borderRadius: '20px' }}>
      {/* border: purple → white sweep */}
      <motion.div
        initial={false}
        className="absolute inset-0"
        style={{ borderRadius: 'inherit' }}
        animate={hovered
          ? {
              opacity: 1,
              boxShadow: [
                '0 0 0 1.5px rgba(168,85,247,0)',
                '0 0 0 1.5px rgba(192,132,252,0.85), 0 0 22px rgba(168,85,247,0.42), inset 0 0 14px rgba(168,85,247,0.1)',
                '0 0 0 1.5px rgba(255,255,255,0.8), 0 0 30px rgba(192,132,252,0.32), inset 0 0 18px rgba(255,255,255,0.08)',
              ],
            }
          : { opacity: 0, boxShadow: '0 0 0 1.5px rgba(168,85,247,0)' }}
        transition={hovered ? { duration: 1.05, times: [0, 0.5, 1], ease: 'easeOut' } : off}
      />
      {/* repeating outer pulse ring */}
      <motion.div
        initial={false}
        className="absolute"
        style={{ inset: '-14px', borderRadius: '28px' }}
        animate={hovered
          ? {
              opacity: [0, 0.5, 0],
              boxShadow: [
                '0 0 0px rgba(168,85,247,0)',
                '0 0 55px 8px rgba(168,85,247,0.25)',
                '0 0 0px rgba(168,85,247,0)',
              ],
            }
          : { opacity: 0 }}
        transition={hovered
          ? { duration: 1.7, repeat: Infinity, ease: 'easeInOut', delay: 0.35, times: [0, 0.5, 1] }
          : { duration: 0.2 }}
      />
      {/* inner card ambient fill */}
      <motion.div
        initial={false}
        className="absolute"
        style={{ inset: '4px', borderRadius: '16px' }}
        animate={hovered
          ? {
              opacity: 1,
              background: [
                'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0) 0%, transparent 65%)',
                'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.13) 0%, transparent 65%)',
              ],
            }
          : { opacity: 0 }}
        transition={hovered ? { duration: 0.8, delay: 0.15, ease: 'easeOut' } : off}
      />
    </div>
  )
}

/* ═══════════════════════════════════════
   ANIMATED TIMER
   ═══════════════════════════════════════ */
function CountdownTimer({ endTime, onExpire, accent = '#3b82f6' }) {
  const [remaining, setRemaining] = useState(0)
  const ringRef = useRef(null)

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const end = new Date(endTime).getTime()
      const left = Math.max(0, Math.floor((end - now) / 1000))
      setRemaining(left)
      if (left <= 0) onExpire?.()
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [endTime, onExpire])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const hours = Math.floor(mins / 60)
  const dispMins = mins % 60

  const isLow = remaining < 120 // less than 2 minutes
  const timerColor = isLow ? '#ef4444' : accent

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {/* Pulsing ring when low */}
        {isLow && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-500/30"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <div
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 flex items-center justify-center"
          style={{ borderColor: `${timerColor}30` }}
        >
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight" style={{ color: timerColor }}>
              {hours > 0 && <span>{hours}:</span>}
              {String(dispMins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">remaining</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   PARTICLE BURST ON RESULTS
   ═══════════════════════════════════════ */
function ParticleField({ count = 40 }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const x = Math.random() * 100
        const delay = Math.random() * 2
        const duration = 3 + Math.random() * 4
        const size = 2 + Math.random() * 4
        const colors = ['#fbbf24', '#a855f7', '#3b82f6', '#10b981', '#ef4444', '#e5e7eb']
        const color = colors[Math.floor(Math.random() * colors.length)]
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ left: `${x}%`, bottom: -10, width: size, height: size, backgroundColor: color }}
            animate={{ y: [0, -(200 + Math.random() * 400)], opacity: [1, 0], x: [0, (Math.random() - 0.5) * 100] }}
            transition={{ duration, delay, repeat: Infinity, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════
   SCORE RING ANIMATION
   ═══════════════════════════════════════ */
function ScoreRing({ score, maxScore = 1000, size = 180, color = '#6366f1' }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const pct = maxScore > 0 ? score / maxScore : 0
  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          className="text-4xl font-bold font-mono"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {score}
        </motion.div>
        <div className="text-[10px] text-white/30 uppercase tracking-wider">points</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   MAIN ARENA PAGE
   ═══════════════════════════════════════ */
export default function ArenaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)

  const { activeTest, loading, error, startTest, finishTest, fetchActiveTest, fetchHistory, history, clearError } = useArenaStore()
  const { dsaProblemsList, dsaProblemsById, fetchDSAProblems } = useDSAProblemStore()

  // Phase: 'select' | 'inProgress' | 'results'
  const [phase, setPhase] = useState('select')
  const [results, setResults] = useState(null)
  const [solvedIds, setSolvedIds] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [hoveredMode, setHoveredMode] = useState(null)

  const headerRef = useRef(null)

  // If navigated here from the editor's Submit button, show results immediately
  useEffect(() => {
    if (location.state?.arenaResults) {
      setResults(location.state.arenaResults)
      setPhase('results')
      fetchHistory()
      // Clear the state so a refresh doesn't re-show stale results
      window.history.replaceState({}, '')
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    fetchDSAProblems()
    fetchHistory()
    fetchActiveTest().then((test) => {
      if (test) setPhase('inProgress')
    })
  }, [])

  // GSAP header entrance
  useEffect(() => {
    if (headerRef.current && phase === 'select') {
      gsap.fromTo(
        headerRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out' }
      )
    }
  }, [phase])

  // Parse problem IDs from active test
  const testProblems = useMemo(() => {
    if (!activeTest?.problemIds) return []
    return activeTest.problemIds.split(',').map(Number).map((id) => dsaProblemsById[String(id)]).filter(Boolean)
  }, [activeTest, dsaProblemsById])

  // Listen for arena solve events from the problem editor tab
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== 'arena_solved') return
      try {
        const data = JSON.parse(e.newValue)
        if (!data || !activeTest) return
        if (String(data.testId) === String(activeTest.id)) {
          setSolvedIds((prev) => {
            const next = new Set(prev)
            next.add(data.problemId)
            return next
          })
        }
      } catch (_) {}
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [activeTest])

  // Persist solved IDs to localStorage so the editor tab can read them on submit
  useEffect(() => {
    if (!activeTest) return
    localStorage.setItem(`arena_solved_ids_${activeTest.id}`, JSON.stringify([...solvedIds]))
  }, [solvedIds, activeTest])

  // Listen for Submit Test triggered from the editor tab
  const handleSubmitRef = useRef(null)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== 'arena_submit') return
      try {
        const data = JSON.parse(e.newValue)
        if (!data || !activeTest) return
        if (String(data.testId) === String(activeTest.id) && handleSubmitRef.current) {
          handleSubmitRef.current()
        }
      } catch (_) {}
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [activeTest])

  // Calculate end time
  const endTime = useMemo(() => {
    if (!activeTest?.startedAt || !activeTest?.durationSeconds) return null
    const start = new Date(activeTest.startedAt).getTime()
    return new Date(start + activeTest.durationSeconds * 1000).toISOString()
  }, [activeTest])

  /* ── Start Test Handler ── */
  const handleStart = async (modeKey) => {
    clearError()
    const test = await startTest(modeKey)
    if (test) {
      await fetchDSAProblems() // ensure we have the assigned problems
      setPhase('inProgress')
      setSolvedIds(new Set())
    }
  }

  /* ── Toggle solved for a problem (disabled – only solved via test pass) ── */
  // No manual toggle in arena; solved state is driven purely by test execution results

  /* ── Submit Test ── */
  const handleSubmit = async () => {
    if (!activeTest) return
    setSubmitting(true)
    const result = await finishTest(activeTest.id, [...solvedIds])
    setSubmitting(false)
    if (result) {
      setResults(result)
      setPhase('results')
      fetchHistory() // refresh history
    }
  }
  // Keep ref in sync so the storage listener can always call the latest version
  useEffect(() => { handleSubmitRef.current = handleSubmit })

  /* ── Time expired ── */
  const handleTimeExpire = useCallback(() => {
    if (phase === 'inProgress') {
      handleSubmit()
    }
  }, [phase, activeTest, solvedIds])

  /* ── Back to selection ── */
  const backToSelect = () => {
    setPhase('select')
    setResults(null)
    setSolvedIds(new Set())
  }

  const modeInfo = activeTest ? TEST_MODES.find((m) => m.key === activeTest.mode) : null

  const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
  const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-black to-purple-900">
      <div className="min-h-screen bg-black/50 backdrop-blur-sm text-white overflow-x-hidden">
        <div className="px-4 sm:px-6 md:px-10 lg:px-16 py-8 max-w-6xl mx-auto pb-28">

          <AnimatePresence mode="wait">

            {/* ════════════════════════════════════
                PHASE: TEST MODE SELECTION
               ════════════════════════════════════ */}
            {phase === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Header */}
                <div ref={headerRef} className="mb-10 text-center">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20">
                      <Swords size={28} className="text-indigo-400" />
                    </div>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                    Arena
                  </h1>
                  <p className="text-sm text-white/40 mt-2 max-w-md mx-auto">
                    Test your DSA skills under pressure. Choose a mode, solve problems, earn badges.
                  </p>
                </div>

                {/* Error toast */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="mb-6 mx-auto max-w-lg flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <AlertCircle size={16} /> {error}
                      <button onClick={clearError} className="ml-auto text-white/30 hover:text-white/60">✕</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Test Mode Cards */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12"
                  initial="hidden" animate="visible" variants={stagger}
                >
                  {TEST_MODES.map((mode, i) => {
                    const Icon = mode.icon
                    return (
                      <motion.div
                        key={mode.key}
                        variants={fadeUp}
                        className={`relative group cursor-pointer rounded-2xl bg-gradient-to-br ${mode.gradient} border ${mode.border} p-6 transition-all duration-300 hover:shadow-xl ${mode.glow}`}
                        onClick={() => handleStart(mode.key)}
                        onMouseEnter={() => setHoveredMode(mode.key)}
                        onMouseLeave={() => setHoveredMode(null)}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ArenaCardBorderEffect modeKey={mode.key} hovered={hoveredMode === mode.key} />
                        {/* Background icon — visible on hover */}
                        <div
                          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
                        >
                          <Icon
                            size={320}
                            className="absolute -top-10 -right-10"
                            style={{ color: mode.accent, opacity: 0.08 }}
                            strokeWidth={1}
                          />
                        </div>

                        {loading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10">
                            <Loader2 className="animate-spin" size={24} />
                          </div>
                        )}

                        <div className="relative z-[2] flex items-start justify-between mb-4">
                          <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${mode.accent}15` }}>
                            <Icon size={24} style={{ color: mode.accent }} />
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-white/30 uppercase tracking-wider">{mode.subtitle}</div>
                            <div className="text-xs font-mono mt-0.5" style={{ color: mode.accent }}>{mode.time}</div>
                          </div>
                        </div>

                        <h3 className="relative z-[2] text-lg font-bold mb-1 group-hover:text-white transition">{mode.title}</h3>
                        <p className="relative z-[2] text-xs text-white/40 mb-4 leading-relaxed">{mode.description}</p>

                        <div className="relative z-[2] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-md border border-white/10 text-white/40">
                              {mode.problems} problem{mode.problems > 1 ? 's' : ''}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md border border-white/10 text-white/40">
                              {mode.difficulty}
                            </span>
                          </div>
                          <ArrowRight size={16} className="text-white/20 group-hover:text-white/60 transition group-hover:translate-x-1 duration-200" />
                        </div>

                        {/* Hover glow effect */}
                        <div
                          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{ background: `radial-gradient(circle at 50% 50%, ${mode.accent}08 0%, transparent 70%)` }}
                        />
                      </motion.div>
                    )
                  })}
                </motion.div>

                {/* Recent History */}
                {history.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h2 className="text-sm text-white/40 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <Clock size={14} /> Recent Tests
                    </h2>
                    <div className="space-y-2">
                      {history.slice(0, 5).map((test, i) => {
                        const badgeCfg = BADGE_CONFIG[test.badge] || BADGE_CONFIG.NONE
                        const mInfo = TEST_MODES.find((m) => m.key === test.mode)
                        const BadgeIcon = badgeCfg.icon
                        return (
                          <motion.div
                            key={test.id}
                            className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.05 }}
                          >
                            <BadgeIcon size={18} style={{ color: badgeCfg.color }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{mInfo?.title || test.mode}</div>
                              <div className="text-[10px] text-white/30">
                                {test.solvedCount}/{test.totalProblems} solved • {new Date(test.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono font-bold" style={{ color: badgeCfg.color }}>{test.score}</div>
                              <div className="text-[9px] uppercase tracking-wider" style={{ color: badgeCfg.color }}>{badgeCfg.label}</div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ════════════════════════════════════
                PHASE: TEST IN PROGRESS
               ════════════════════════════════════ */}
            {phase === 'inProgress' && activeTest && (
              <motion.div
                key="inProgress"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Mode header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs text-white/50 mb-3">
                    {modeInfo && <modeInfo.icon size={14} style={{ color: modeInfo.accent }} />}
                    {modeInfo?.title || activeTest.mode}
                  </div>
                  <h2 className="text-xl font-bold">Test In Progress</h2>
                </div>

                {/* Timer */}
                {endTime && (
                  <div className="flex justify-center mb-8">
                    <CountdownTimer
                      endTime={endTime}
                      onExpire={handleTimeExpire}
                      accent={modeInfo?.accent || '#3b82f6'}
                    />
                  </div>
                )}

                {/* Progress bar */}
                <div className="max-w-lg mx-auto mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/40">Progress</span>
                    <span className="text-xs font-mono text-white/60">{solvedIds.size}/{activeTest.totalProblems}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: modeInfo?.accent || '#3b82f6' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(solvedIds.size / activeTest.totalProblems) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Problem Cards */}
                <div className="space-y-4 max-w-2xl mx-auto mb-8">
                  {testProblems.map((problem, i) => {
                    const isSolved = solvedIds.has(problem.id)
                    const diff = problem.difficulty?.toLowerCase()
                    const diffColors = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
                    return (
                      <motion.div
                        key={problem.id}
                        className={`relative rounded-2xl border p-5 transition-all duration-300 ${
                          isSolved
                            ? 'bg-emerald-500/[0.06] border-emerald-500/30'
                            : 'bg-white/[0.02] border-white/[0.08] hover:border-white/15'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                            isSolved ? 'bg-emerald-500/20' : 'bg-white/5'
                          }`}>
                            {isSolved
                              ? <CheckCircle2 size={18} className="text-emerald-400" />
                              : <span className="text-sm font-mono text-white/30">{i + 1}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold">{problem.title}</h3>
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded-md font-medium uppercase tracking-wider"
                                style={{ color: diffColors[diff] || '#fff', backgroundColor: `${diffColors[diff] || '#fff'}15` }}
                              >
                                {problem.difficulty}
                              </span>
                            </div>
                            <p className="text-xs text-white/40 line-clamp-2">{problem.description}</p>

                            {/* Navigate to problem to solve it – with arena params */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const problemIds = activeTest.problemIds // e.g. "1,2,3"
                                window.open(`/dsa-problems/${problem.id}?arena=1&testId=${activeTest.id}&problems=${problemIds}&idx=${i}`, '_blank')
                              }}
                              className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
                            >
                              Open in editor <ArrowRight size={10} />
                            </button>
                          </div>
                        </div>

                        {isSolved && (
                          <motion.div
                            className="absolute top-3 right-3"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                          >
                            <Sparkles size={16} className="text-amber-400" />
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Submit button */}
                <div className="flex justify-center gap-4">
                  <motion.button
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-sm transition-all"
                    style={{
                      backgroundColor: `${modeInfo?.accent || '#3b82f6'}20`,
                      borderColor: `${modeInfo?.accent || '#3b82f6'}40`,
                      color: modeInfo?.accent || '#3b82f6',
                      border: '1px solid',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={16} />}
                    {submitting ? 'Evaluating...' : 'Submit Test'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════
                PHASE: RESULTS
               ════════════════════════════════════ */}
            {phase === 'results' && results && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {/* Particles */}
                {results.score >= 500 && <ParticleField count={results.score >= 900 ? 60 : results.score >= 750 ? 40 : 25} />}

                <div className="text-center mb-10 relative z-10">
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                      {results.score >= 900 ? '🏆 Outstanding!' :
                       results.score >= 750 ? '🥇 Excellent!' :
                       results.score >= 500 ? '🥈 Great Job!' :
                       results.score >= 250 ? '🥉 Good Effort!' :
                       'Keep Practicing!'}
                    </h1>
                    <p className="text-sm text-white/40">
                      {TEST_MODES.find((m) => m.key === results.mode)?.title || results.mode} completed
                    </p>
                  </motion.div>
                </div>

                {/* Score Ring */}
                <div className="flex justify-center mb-10 relative z-10">
                  <ScoreRing
                    score={results.score}
                    color={BADGE_CONFIG[results.badge]?.color || '#6366f1'}
                  />
                </div>

                {/* Stats Grid */}
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8 relative z-10"
                  initial="hidden" animate="visible" variants={stagger}
                >
                  {[
                    { icon: Target, label: 'Solved', value: `${results.solvedCount}/${results.totalProblems}`, color: '#10b981' },
                    { icon: Timer, label: 'Time Bonus', value: `+${results.timeBonus}`, color: '#f59e0b' },
                    {
                      icon: BADGE_CONFIG[results.badge]?.icon || Star,
                      label: 'Badge',
                      value: BADGE_CONFIG[results.badge]?.label || 'None',
                      color: BADGE_CONFIG[results.badge]?.color || '#64748b',
                    },
                    { icon: TrendingUp, label: 'Score', value: results.score, color: '#6366f1' },
                  ].map((s) => (
                    <motion.div
                      key={s.label}
                      variants={fadeUp}
                      className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 text-center"
                    >
                      <s.icon size={18} className="mx-auto" style={{ color: s.color }} />
                      <div className="text-lg font-bold">{s.value}</div>
                      <div className="text-[10px] text-white/30 uppercase tracking-wider">{s.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Badge showcase */}
                {results.badge !== 'NONE' && (
                  <motion.div
                    className={`max-w-sm mx-auto rounded-2xl bg-gradient-to-br ${BADGE_CONFIG[results.badge].bg} border border-white/10 p-6 text-center mb-8 relative z-10`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
                  >
                    <motion.div
                      animate={{ rotateY: [0, 360] }}
                      transition={{ duration: 2, delay: 1.5 }}
                    >
                      {React.createElement(BADGE_CONFIG[results.badge].icon, {
                        size: 48,
                        style: { color: BADGE_CONFIG[results.badge].color },
                        className: 'mx-auto mb-3',
                      })}
                    </motion.div>
                    <h3 className="text-lg font-bold" style={{ color: BADGE_CONFIG[results.badge].color }}>
                      {BADGE_CONFIG[results.badge].label} Badge Earned!
                    </h3>
                    <p className="text-xs text-white/30 mt-1">
                      Score {results.score} points in {TEST_MODES.find((m) => m.key === results.mode)?.title}
                    </p>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex justify-center gap-4 relative z-10">
                  <motion.button
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-sm text-indigo-400 font-medium hover:bg-indigo-500/30 transition"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={backToSelect}
                  >
                    <RotateCcw size={16} /> Try Again
                  </motion.button>
                  <motion.button
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white/60 font-medium hover:text-white/80 transition"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/profile')}
                  >
                    <TrendingUp size={16} /> View Profile
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
