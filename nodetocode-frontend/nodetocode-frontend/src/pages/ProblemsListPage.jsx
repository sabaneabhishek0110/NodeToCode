import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import axios from 'axios'
import {
  BookOpen, Search, Filter, CheckCircle2, Circle,
  ArrowRight, Loader2, AlertCircle, Inbox,
  BarChart3, TrendingUp, Target, Flame, Code2, Layers,
} from 'lucide-react'
import useProblemStore from '../store/problemStore'
import useDSAProblemStore from '../store/dsaProblemStore'

/* ── Difficulty palette ── */
const DIFF = {
  easy:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  medium: { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   bar: 'bg-amber-500'   },
  hard:   { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     bar: 'bg-red-500'     },
}
const diffStyle = (d) => DIFF[d?.toLowerCase()] || DIFF.easy

/* ── Fetch solved problem IDs from backend ── */
function useSolvedSet(endpoint) {
  const [solved, setSolved] = useState(new Set())
  useEffect(() => {
    axios.get(endpoint, { withCredentials: true })
      .then((res) => {
        if (Array.isArray(res.data)) setSolved(new Set(res.data))
      })
      .catch((err) => console.error('Failed to fetch solved:', err))
  }, [endpoint])
  return solved
}

/* ── Animated counter ── */
function Counter({ to, duration = 1.2, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.fromTo(el, { innerText: 0 }, {
      innerText: to,
      duration,
      ease: 'power2.out',
      snap: { innerText: 1 },
      onUpdate() { el.textContent = Math.round(gsap.getProperty(el, 'innerText')) },
    })
  }, [to, duration])
  return <span ref={ref} className={className}>0</span>
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function ProblemsListPage() {
  /* ── Category toggle ── */
  const [category, setCategory] = useState('design') // 'design' | 'dsa'

  /* ── Design Pattern problems ── */
  const dpProblems = useProblemStore((s) => s.problemsList)
  const fetchDPProblems = useProblemStore((s) => s.fetchProblems)
  const dpLoading = useProblemStore((s) => s.loading)
  const dpError = useProblemStore((s) => s.error)

  /* ── DSA problems ── */
  const dsaProblems = useDSAProblemStore((s) => s.dsaProblemsList)
  const fetchDSAProblems = useDSAProblemStore((s) => s.fetchDSAProblems)
  const dsaLoading = useDSAProblemStore((s) => s.loading)
  const dsaError = useDSAProblemStore((s) => s.error)

  /* ── Pick active data based on category ── */
  const problems = category === 'design' ? dpProblems : dsaProblems
  const loading = category === 'design' ? dpLoading : dsaLoading
  const error = category === 'design' ? dpError : dsaError

  const dpSolved = useSolvedSet('http://localhost:8080/api/submissions/solved')
  const dsaSolved = useSolvedSet('http://localhost:8080/api/dsa-submissions/solved')
  const solved = category === 'design' ? dpSolved : dsaSolved

  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState('all')
  const headerRef = useRef(null)

  useEffect(() => { fetchDPProblems() }, [fetchDPProblems])
  useEffect(() => { fetchDSAProblems() }, [fetchDSAProblems])

  /* ── GSAP header reveal ── */
  useEffect(() => {
    if (!headerRef.current) return
    gsap.fromTo(headerRef.current.children,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out' }
    )
  }, [])

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    let list = problems
    if (diffFilter !== 'all') list = list.filter((p) => p.difficulty?.toLowerCase() === diffFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.title?.toLowerCase().includes(q))
    }
    return list
  }, [problems, diffFilter, search])

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = problems.length
    const solvedCount = problems.filter((p) => solved.has(p.id)).length
    const easy = problems.filter((p) => p.difficulty?.toLowerCase() === 'easy').length
    const med = problems.filter((p) => p.difficulty?.toLowerCase() === 'medium').length
    const hard = problems.filter((p) => p.difficulty?.toLowerCase() === 'hard').length
    const solvedEasy = problems.filter((p) => p.difficulty?.toLowerCase() === 'easy' && solved.has(p.id)).length
    const solvedMed = problems.filter((p) => p.difficulty?.toLowerCase() === 'medium' && solved.has(p.id)).length
    const solvedHard = problems.filter((p) => p.difficulty?.toLowerCase() === 'hard' && solved.has(p.id)).length
    return { total, solvedCount, easy, med, hard, solvedEasy, solvedMed, solvedHard }
  }, [problems, solved])

  const pct = stats.total ? Math.round((stats.solvedCount / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-600 via-black to-purple-600">
      <div className="min-h-screen bg-black/40 backdrop-blur-sm text-white overflow-x-hidden">
        <div className="px-4 sm:px-6 md:px-10 lg:px-16 py-8 max-w-7xl mx-auto pb-28">

          {/* ── Header ── */}
          <div ref={headerRef} className="mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                <BookOpen size={22} className="text-blue-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Problems</h1>
            </div>
            <p className="mt-2 text-sm text-white/40 max-w-lg">
              Sharpen your skills — solve coding challenges, track your progress, and level up.
            </p>

            {/* ── Category Toggle ── */}
            <div className="mt-4 inline-flex rounded-xl bg-black/60 border border-white/10 p-1 gap-1">
              <button
                onClick={() => setCategory('design')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  category === 'design'
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/15 shadow-sm'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                }`}
              >
                <Layers size={14} />
                Design Patterns
              </button>
              <button
                onClick={() => setCategory('dsa')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  category === 'dsa'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-white/15 shadow-sm'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                }`}
              >
                <Code2 size={14} />
                DSA
              </button>
            </div>
          </div>

          {/* ── Analytics Panel ── */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Overall progress */}
            <div className="col-span-2 sm:col-span-1 bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-white/40 text-xs"><Target size={13} /> Progress</div>
              <div className="text-2xl font-bold">
                <Counter to={pct} />
                <span className="text-base text-white/30 ml-0.5">%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Solved */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-white/40 text-xs"><CheckCircle2 size={13} /> Solved</div>
              <div className="text-2xl font-bold text-emerald-400">
                <Counter to={stats.solvedCount} /> <span className="text-sm text-white/20">/ {stats.total}</span>
              </div>
            </div>

            {/* Streak placeholder */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-white/40 text-xs"><Flame size={13} /> Streak</div>
              <div className="text-2xl font-bold text-amber-400">
                <Counter to={stats.solvedCount > 0 ? Math.min(stats.solvedCount, 7) : 0} />
                <span className="text-sm text-white/20 ml-1">days</span>
              </div>
            </div>

            {/* Difficulty breakdown */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-white/40 text-xs mb-1"><BarChart3 size={13} /> Breakdown</div>
              {[ ['Easy', stats.solvedEasy, stats.easy, 'bg-emerald-500'],
                 ['Med',  stats.solvedMed,  stats.med,  'bg-amber-500'],
                 ['Hard', stats.solvedHard, stats.hard, 'bg-red-500'],
              ].map(([label, done, total, color]) => (
                <div key={label} className="flex items-center gap-2 text-[10px]">
                  <span className="w-7 text-white/40">{label}</span>
                  <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${color}`}
                      initial={{ width: 0 }}
                      animate={{ width: total ? `${(done / total) * 100}%` : '0%' }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-white/30 w-8 text-right">{done}/{total}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Filters ── */}
          <motion.div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problems..."
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white/80 placeholder-white/25 outline-none focus:border-blue-500/40 transition"
              />
            </div>

            {/* Difficulty chips */}
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-white/30" />
              {['all', 'easy', 'medium', 'hard'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDiffFilter(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    diffFilter === d
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-white/40 hover:text-white/70 border border-transparent'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Loading / Error / Empty ── */}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-white/50 py-20">
              <Loader2 size={18} className="animate-spin" /><span>Loading problems...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 py-20">
              <AlertCircle size={18} /><span>{error}</span>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 text-white/40 py-20">
              <Inbox size={32} className="text-white/15" />
              <span className="text-sm">No problems found</span>
            </div>
          )}

          {/* ── Problem Cards ── */}
          {!loading && filtered.length > 0 && (
            <motion.div
              key={category + diffFilter + search}
              className="flex flex-col gap-3"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            >
              {filtered.map((p) => {
                const ds = diffStyle(p.difficulty)
                const isSolved = solved.has(p.id)
                return (
                  <motion.div
                    key={p.id}
                    variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                    className={`group relative bg-black/60 border rounded-2xl overflow-hidden transition-all
                      ${isSolved ? 'border-emerald-500/20' : 'border-white/[0.06] hover:border-white/15'}`}
                  >
                    <div className="flex items-center gap-4 px-4 sm:px-5 py-4">
                      {/* Solved indicator */}
                      <div className="shrink-0">
                        {isSolved
                          ? <CheckCircle2 size={20} className="text-emerald-400" />
                          : <Circle size={20} className="text-white/15 group-hover:text-white/30 transition" />
                        }
                      </div>

                      {/* Title + tags */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${ds.bg} ${ds.border} ${ds.text}`}>
                            {p.difficulty}
                          </span>
                          <h3 className={`text-sm font-semibold truncate ${isSolved ? 'text-white/50 line-through decoration-white/20' : 'text-white/90'}`}>
                            {p.title}
                          </h3>
                        </div>
                        {p.description && (
                          <p className="text-xs text-white/30 mt-1 line-clamp-1">{p.description}</p>
                        )}
                      </div>

                      {/* Solve button */}
                      <Link
                        to={category === 'design' ? `/problems/${p.id}` : `/dsa-problems/${p.id}`}
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all
                          bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white group/btn border border-transparent hover:border-white/10"
                      >
                        <span>{isSolved ? 'Revisit' : 'Solve'}</span>
                        <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {/* Subtle gradient accent on hover */}
                    <div className={`absolute inset-y-0 left-0 w-[3px] transition-opacity ${isSolved ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'} ${ds.bar} rounded-full`} />
                  </motion.div>
                )
              })}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}
