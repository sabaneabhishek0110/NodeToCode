import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import {
  FolderKanban, Plus, Search, Trash2, Loader2, AlertCircle,
  Inbox, Code2, Calendar, MoreVertical, X,
} from 'lucide-react'
import useProjectStore from '../store/projectStore'
import NewProject from '../components/NewProject'

/* ── Language badge colors ── */
const LANG_COLORS = {
  java:       { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  python:     { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  cpp:        { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20'   },
  javascript: { bg: 'bg-emerald-500/10',text: 'text-emerald-400',border: 'border-emerald-500/20' },
}
const langStyle = (l) => LANG_COLORS[l?.toLowerCase()] || LANG_COLORS.java

export default function ProjectsListPage() {
  const navigate = useNavigate()
  const projects = useProjectStore((s) => s.projects)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const loading = useProjectStore((s) => s.loading)
  const error = useProjectStore((s) => s.error)

  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('all')
  const [menuOpen, setMenuOpen] = useState(null) // project id
  const [confirmDelete, setConfirmDelete] = useState(null)
  const headerRef = useRef(null)

  useEffect(() => { fetchProjects() }, [fetchProjects])

  /* ── GSAP header ── */
  useEffect(() => {
    if (!headerRef.current) return
    gsap.fromTo(headerRef.current.children,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: 'power3.out' }
    )
  }, [])

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    let list = projects
    if (langFilter !== 'all') list = list.filter((p) => p.language?.toLowerCase() === langFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
    }
    return list
  }, [projects, langFilter, search])

  /* ── Stats ── */
  const langCounts = useMemo(() => {
    const m = {}
    projects.forEach((p) => {
      const l = (p.language || 'java').toLowerCase()
      m[l] = (m[l] || 0) + 1
    })
    return m
  }, [projects])

  const handleDelete = async (id) => {
    await deleteProject(id)
    setConfirmDelete(null)
    setMenuOpen(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-600 via-black to-purple-600">
      <div className="min-h-screen bg-black/40 backdrop-blur-sm text-white overflow-x-hidden">
        <div className="px-4 sm:px-6 md:px-10 lg:px-16 py-8 max-w-7xl mx-auto pb-28">

          {/* ── Header ── */}
          <div ref={headerRef} className="mb-8 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10">
                  <FolderKanban size={22} className="text-purple-400" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Projects</h1>
              </div>
              <p className="mt-2 text-sm text-white/40 max-w-lg">
                Your personal workspace — create, edit, and manage all your coding projects.
              </p>
            </div>

            {/* New project button */}
            <motion.button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-medium hover:brightness-110 transition shrink-0"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Project</span>
            </motion.button>
          </div>

          {/* ── Stats row ── */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Total</span>
              <span className="text-xl font-bold">{projects.length}</span>
            </div>
            {Object.entries(langCounts).slice(0, 3).map(([lang, count]) => {
              const ls = langStyle(lang)
              return (
                <div key={lang} className={`bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-1`}>
                  <span className={`text-[10px] uppercase tracking-wider ${ls.text}`}>{lang}</span>
                  <span className="text-xl font-bold">{count}</span>
                </div>
              )
            })}
          </motion.div>

          {/* ── Filters ── */}
          <motion.div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white/80 placeholder-white/25 outline-none focus:border-purple-500/40 transition"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {['all', ...Object.keys(LANG_COLORS)].map((l) => (
                <button
                  key={l}
                  onClick={() => setLangFilter(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    langFilter === l
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-white/40 hover:text-white/70 border border-transparent'
                  }`}
                >
                  {l === 'cpp' ? 'C++' : l}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Loading / Error / Empty ── */}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-white/50 py-20">
              <Loader2 size={18} className="animate-spin" /><span>Loading projects...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 py-20">
              <AlertCircle size={18} /><span>{error}</span>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 text-white/40 py-20">
              <Inbox size={36} className="text-white/15" />
              <span className="text-sm">No projects found</span>
              <button onClick={() => setShowModal(true)} className="text-xs text-blue-400 hover:text-blue-300 transition">
                Create your first project
              </button>
            </div>
          )}

          {/* ── Project Grid ── */}
          {!loading && filtered.length > 0 && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {filtered.map((proj) => {
                const ls = langStyle(proj.language)
                return (
                  <motion.div
                    key={proj.id}
                    variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
                    className="group relative"
                  >
                    <div
                      onClick={() => navigate(`/projects/${proj.id}`)}
                      className="cursor-pointer bg-black/60 border border-white/[0.06] hover:border-white/15 rounded-2xl p-5 flex flex-col gap-3 transition-all h-full"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white/90 truncate group-hover:text-white transition">
                            {proj.title}
                          </h3>
                          <p className="text-xs text-white/30 mt-1 line-clamp-2">{proj.description || 'No description'}</p>
                        </div>
                        {/* Three-dot menu */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === proj.id ? null : proj.id) }}
                          className="p-1 rounded-lg hover:bg-white/5 text-white/20 hover:text-white/50 transition"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/[0.04]">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${ls.bg} ${ls.border} ${ls.text} uppercase`}>
                          <Code2 size={10} className="inline mr-1 -mt-0.5" />
                          {proj.language || 'JAVA'}
                        </span>
                        {proj.updatedAt && (
                          <span className="text-[10px] text-white/25 flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(proj.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Context menu */}
                    <AnimatePresence>
                      {menuOpen === proj.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -4 }}
                          className="absolute top-12 right-4 z-30 bg-black/95 border border-white/10 rounded-xl p-1 shadow-2xl min-w-[140px]"
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/projects/${proj.id}`) }}
                            className="w-full text-left px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition"
                          >
                            Open
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(proj.id) }}
                            className="w-full text-left px-3 py-2 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          >
                            <Trash2 size={12} className="inline mr-1.5 -mt-0.5" />Delete
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(null) }}
                            className="w-full text-left px-3 py-2 text-xs text-white/30 hover:text-white/50 rounded-lg transition"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* ── Delete confirmation ── */}
          <AnimatePresence>
            {confirmDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center"
                onClick={() => { setConfirmDelete(null); setMenuOpen(null) }}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-black/95 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 text-center"
                >
                  <Trash2 size={28} className="mx-auto text-red-400 mb-3" />
                  <h3 className="text-sm font-semibold mb-1">Delete Project?</h3>
                  <p className="text-xs text-white/40 mb-5">This action cannot be undone.</p>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      onClick={() => { setConfirmDelete(null); setMenuOpen(null) }}
                      className="px-4 py-2 text-xs rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(confirmDelete)}
                      className="px-4 py-2 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Create project modal */}
      <AnimatePresence>
        {showModal && <NewProject onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
