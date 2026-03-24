import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import useAuthStore from '../store/authStore'
import useProblemStore from '../store/problemStore'
import useProjectStore from '../store/projectStore'
import ProblemCard from '../components/ProblemCard'
import NewProject from '../components/NewProject'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, FolderKanban, BookOpen, Loader2, AlertCircle, Inbox, Calendar, Code2 } from 'lucide-react'

/* ══════════════════════════════════════════════════════════════
   CreateProjectCard – GSAP-animated card with corner brackets,
   rotating ring, spinning plus icon, and particle burst
   ══════════════════════════════════════════════════════════════ */
function CreateProjectCard({ onClick }) {
  const cardRef = useRef(null)
  const cornersRef = useRef([])
  const ringRef = useRef(null)
  const iconRef = useRef(null)
  const iconWrapRef = useRef(null)
  const glowRef = useRef(null)
  const labelRef = useRef(null)
  const sublabelRef = useRef(null)
  const particlesRef = useRef([])
  const spinTween = useRef(null)

  const accent = '#34d399'  // emerald-400
  const cs = 10             // corner bracket size
  const ct = 2              // corner bracket thickness

  const cornerStyles = [
    { top: 6, left: 6, borderTop: `${ct}px solid ${accent}`, borderLeft: `${ct}px solid ${accent}`, borderRadius: '4px 0 0 0' },
    { top: 6, right: 6, borderTop: `${ct}px solid ${accent}`, borderRight: `${ct}px solid ${accent}`, borderRadius: '0 4px 0 0' },
    { bottom: 6, left: 6, borderBottom: `${ct}px solid ${accent}`, borderLeft: `${ct}px solid ${accent}`, borderRadius: '0 0 0 4px' },
    { bottom: 6, right: 6, borderBottom: `${ct}px solid ${accent}`, borderRight: `${ct}px solid ${accent}`, borderRadius: '0 0 4px 0' },
  ]

  const onEnter = useCallback(() => {
    // Corner brackets fly in
    cornersRef.current.forEach((el, i) => {
      if (!el) return
      gsap.killTweensOf(el)
      gsap.fromTo(el,
        { opacity: 0, scale: 0 },
        { opacity: 1, scale: 1, duration: 0.4, delay: i * 0.06, ease: 'back.out(3)' }
      )
    })
    // Dashed ring appears & spins
    if (ringRef.current) {
      gsap.to(ringRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' })
      spinTween.current = gsap.to(ringRef.current, { rotation: '+=360', duration: 6, repeat: -1, ease: 'none' })
    }
    // Plus icon: rotate 180 + scale + recolor
    if (iconRef.current) {
      gsap.to(iconRef.current, { rotation: 180, scale: 1.3, color: accent, duration: 0.45, ease: 'back.out(2)' })
    }
    // Icon wrapper glow ring pulse
    if (iconWrapRef.current) {
      gsap.to(iconWrapRef.current, {
        boxShadow: `0 0 20px ${accent}40, 0 0 40px ${accent}20`,
        borderColor: `${accent}60`,
        duration: 0.35,
      })
    }
    // Radial glow
    if (glowRef.current) {
      gsap.to(glowRef.current, { opacity: 1, scale: 1.1, duration: 0.4, ease: 'power2.out' })
    }
    // Label brightes
    if (labelRef.current) gsap.to(labelRef.current, { color: '#fff', y: -1, duration: 0.25 })
    if (sublabelRef.current) gsap.to(sublabelRef.current, { opacity: 1, y: 0, duration: 0.3, delay: 0.1 })
    // Card lifts
    if (cardRef.current) gsap.to(cardRef.current, { y: -4, duration: 0.3, ease: 'power2.out' })
    // Particles burst outward
    particlesRef.current.forEach((el, i) => {
      if (!el) return
      const angle = (i / 6) * Math.PI * 2
      const dist = 28 + Math.random() * 14
      gsap.fromTo(el,
        { opacity: 0, scale: 0, x: 0, y: 0 },
        {
          opacity: 1, scale: 1,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          duration: 0.5, delay: 0.1 + i * 0.03,
          ease: 'power2.out',
        }
      )
      gsap.to(el, { opacity: 0, duration: 0.4, delay: 0.45 + i * 0.03 })
    })
  }, [])

  const onLeave = useCallback(() => {
    // Corners out
    cornersRef.current.forEach((el) => {
      if (!el) return
      gsap.killTweensOf(el)
      gsap.to(el, { opacity: 0, scale: 0, duration: 0.2, ease: 'power2.in' })
    })
    // Ring out
    if (spinTween.current) { spinTween.current.kill(); spinTween.current = null }
    if (ringRef.current) gsap.to(ringRef.current, { opacity: 0, scale: 0.8, rotation: 0, duration: 0.25 })
    // Icon revert
    if (iconRef.current) gsap.to(iconRef.current, { rotation: 0, scale: 1, color: '#059669', duration: 0.3 })
    // Icon wrapper revert
    if (iconWrapRef.current) {
      gsap.to(iconWrapRef.current, {
        boxShadow: '0 0 0px transparent',
        borderColor: 'rgba(255,255,255,0.06)',
        duration: 0.3,
      })
    }
    // Glow out
    if (glowRef.current) gsap.to(glowRef.current, { opacity: 0, scale: 1, duration: 0.25 })
    // Label revert
    if (labelRef.current) gsap.to(labelRef.current, { color: 'rgba(229,231,235,1)', y: 0, duration: 0.2 })
    if (sublabelRef.current) gsap.to(sublabelRef.current, { opacity: 0, y: 4, duration: 0.2 })
    // Card back
    if (cardRef.current) gsap.to(cardRef.current, { y: 0, duration: 0.3, ease: 'power2.out' })
  }, [])

  return (
    <div
      ref={cardRef}
      data-card
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="
        relative shrink-0 w-[86vw] sm:w-auto
        aspect-[4/3] cursor-pointer snap-center
        sm:snap-auto rounded-xl
        bg-gradient-to-br from-white/[0.06] to-white/[0.02]
        border border-white/[0.06]
        p-4 flex flex-col items-center justify-center gap-3
        overflow-hidden
      "
    >
      {/* Corner brackets */}
      {cornerStyles.map((style, i) => (
        <div
          key={i}
          ref={(el) => (cornersRef.current[i] = el)}
          className="absolute pointer-events-none"
          style={{ width: cs, height: cs, opacity: 0, ...style }}
        />
      ))}

      {/* Radial glow bg */}
      <div
        ref={glowRef}
        className="absolute inset-0 rounded-xl pointer-events-none opacity-0"
        style={{
          background: `radial-gradient(ellipse at center, ${accent}15 0%, transparent 65%)`,
        }}
      />

      {/* Icon container with rotating dashed ring */}
      <div className="relative flex items-center justify-center">
        {/* Dashed ring */}
        <div
          ref={ringRef}
          className="absolute rounded-full pointer-events-none opacity-0"
          style={{
            width: 64, height: 64,
            border: `1.5px dashed ${accent}80`,
          }}
        />

        {/* Particle burst dots */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => (particlesRef.current[i] = el)}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 3, height: 3,
              background: accent,
              opacity: 0,
            }}
          />
        ))}

        {/* Icon circle */}
        <div
          ref={iconWrapRef}
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-black/80 border border-white/[0.06] flex items-center justify-center transition-colors"
        >
          <div ref={iconRef} style={{ color: '#059669' }}>
            <Plus size={24} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="flex flex-col items-center gap-0.5">
        <p
          ref={labelRef}
          className="text-xs tracking-wide text-gray-200 font-semibold"
        >
          Create Project
        </p>
        <p
          ref={sublabelRef}
          className="text-[10px] tracking-wide text-white/40 font-medium opacity-0"
          style={{ transform: 'translateY(4px)' }}
        >
          Start something new
        </p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const carouselRef = useRef(null)

  // Problem store
  const problems = useProblemStore((s) => s.problemsList)
  const fetchProblems = useProblemStore((s) => s.fetchProblems)
  const loading = useProblemStore((s) => s.loading)
  const error = useProblemStore((s) => s.error)

  // Project store
  const projectsList = useProjectStore((s) => s.projects)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const projectsLoading = useProjectStore((s) => s.loading)

  // Create project modal
  const [showModal, setShowModal] = useState(false)

  // Fetch problems + projects on mount
  useEffect(() => {
    fetchProblems()
    fetchProjects()
  }, [fetchProblems, fetchProjects])


  // Typewriter: welcome typed once, second line cycles messages with backspace
  const Typewriter = ({ welcome = '', messages = [], speed = 35, pause = 900, deleteSpeed = 25 }) => {
    const [welcomeText, setWelcomeText] = useState('')
    const [msgText, setMsgText] = useState('')
    const [msgIndex, setMsgIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
      let mounted = true

      // type welcome once
      if (welcomeText !== welcome) {
        const i = welcomeText.length
        if (i < welcome.length && mounted) {
          const t = setTimeout(() => setWelcomeText(welcome.slice(0, i + 1)), speed)
          return () => clearTimeout(t)
        }
      }

      // after welcome done, handle rotating messages
      if (welcomeText === welcome && messages.length) {
        const current = messages[msgIndex % messages.length]

        if (!isDeleting) {
          // typing
          if (msgText.length < current.length) {
            const t = setTimeout(() => setMsgText(current.slice(0, msgText.length + 1)), speed)
            return () => clearTimeout(t)
          }
          // finished typing, pause then start deleting
          const t = setTimeout(() => setIsDeleting(true), pause)
          return () => clearTimeout(t)
        } else {
          // deleting
          if (msgText.length > 0) {
            const t = setTimeout(() => setMsgText(current.slice(0, msgText.length - 1)), deleteSpeed)
            return () => clearTimeout(t)
          }
          // deleted, move to next message
          setIsDeleting(false)
          setMsgIndex((s) => (s + 1) % messages.length)
        }
      }

      return () => {
        mounted = false
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [welcome, welcomeText, msgText, msgIndex, isDeleting, messages.join('|')])

    return (
      <div className="flex flex-col">
        <div className="text-lg md:text-2xl font-medium tracking-tight">
          <span>{welcomeText}</span>
          <span className="ml-1 text-white/70">|</span>
        </div>
        <div className="text-xs md:text-sm text-white/70 mt-1">
          <span>{msgText}</span>
          <span className="ml-1 text-white/70">|</span>
        </div>
      </div>
    )
  }

  const scroll = (dir) => {
    if (!carouselRef.current) return
    // Prefer scrolling by one card width (first card) so carousel moves predictably on mobile
    const firstCard = carouselRef.current.querySelector('[data-card]')
    let scrollBy = carouselRef.current.offsetWidth
    if (firstCard) {
      const style = getComputedStyle(firstCard)
      const mr = parseFloat(style.marginRight || '0')
      scrollBy = Math.round(firstCard.offsetWidth + mr)
    }
    carouselRef.current.scrollBy({ left: dir === 'left' ? -scrollBy : scrollBy, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-600 via-black to-purple-600 overflow-x-hidden overflow-y-auto">
      <div className="min-h-screen bg-black/40 backdrop-blur-sm text-white text-sm md:text-base overflow-x-hidden">

        {/* Small, consistent side margins */}
        <div className="px-3 sm:px-5 md:px-8 lg:px-10 py-6 w-full max-w-[100vw]">

          {/* Header (typewriter effect) */}
          <header className="flex flex-col gap-2">
              <Typewriter
                welcome={`Welcome${user && user.name ? `, ${user.name}` : ''}`}
                messages={[
                  'Visual node-based coding — build, run, and share.',
                  'Connect blocks, run simulations, and export your project.'
                ]}
                speed={35}
                pause={900}
                deleteSpeed={30}
              />
          </header>

          {/* ================= PROJECTS ================= */}
          <motion.section
            className="mt-8 bg-black/50 p-4 sm:p-6 rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban size={16} className="text-blue-400" />
                <h2 className="text-base md:text-lg font-medium tracking-tight">Projects</h2>
              </div>

              {/* Carousel arrows — visible only on mobile */}
              <div className="flex gap-2 sm:hidden">
                <button
                  onClick={() => scroll('left')}
                  className="p-1 rounded-full bg-white/10 active:bg-white/20"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="p-1 rounded-full bg-white/10 active:bg-white/20"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/*
              Mobile  → horizontal snap-scroll carousel (no scrollbar)
              ≥sm     → normal grid, 2 cols → 3 → 4
            */}
            <div
              ref={carouselRef}
              className="
                mt-4 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth
                sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5 sm:overflow-visible
                scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
              "
            >
              {/* ── Create Project card (GSAP-enhanced) ── */}
              <CreateProjectCard onClick={() => setShowModal(true)} />

              {/* ── Real project cards ── */}
              {projectsList.map((proj, i) => (
                <motion.div
                  key={proj.id}
                  data-card
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  className="
                    spinning-border shrink-0 w-[80vw] sm:w-auto
                    aspect-[4/3] cursor-pointer snap-center
                    sm:snap-auto group/card
                  "
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative w-full h-full rounded-[14px] bg-black p-4 flex flex-col justify-between overflow-hidden">
                    {/* Default view */}
                    <div className="transition-opacity duration-200 group-hover/card:opacity-0">
                      <div className="text-sm font-medium">{proj.title}</div>
                      <div className="text-xs text-white/50 mt-1">{proj.description?.slice(0, 80) || 'No description'}</div>
                    </div>
                    <div className="flex items-center justify-between transition-opacity duration-200 group-hover/card:opacity-0">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60 flex items-center gap-1">
                        <Code2 size={10} />
                        {proj.language || 'JAVA'}
                      </span>
                      {proj.updatedAt && (
                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(proj.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Hover overlay with more info */}
                    <div className="absolute inset-0 rounded-[14px] bg-black/95 p-4 flex flex-col justify-between opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                      <div>
                        <div className="text-sm font-semibold text-white">{proj.title}</div>
                        <div className="text-xs text-white/40 mt-1 line-clamp-2">{proj.description || 'No description'}</div>
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center gap-2">
                          <Code2 size={11} className="text-blue-400" />
                          <span className="text-[11px] text-white/70">Language: <span className="text-white/90 font-medium">{proj.language || 'JAVA'}</span></span>
                        </div>
                        {proj.createdAt && (
                          <div className="flex items-center gap-2">
                            <Calendar size={11} className="text-purple-400" />
                            <span className="text-[11px] text-white/70">Created: <span className="text-white/90 font-medium">{new Date(proj.createdAt).toLocaleDateString()}</span></span>
                          </div>
                        )}
                        {proj.updatedAt && (
                          <div className="flex items-center gap-2">
                            <Calendar size={11} className="text-emerald-400" />
                            <span className="text-[11px] text-white/70">Updated: <span className="text-white/90 font-medium">{new Date(proj.updatedAt).toLocaleDateString()}</span></span>
                          </div>
                        )}
                      </div>
                      <div className="mt-auto pt-2 text-[10px] text-blue-400 font-medium text-center">Click to open →</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ================= PROBLEMS ================= */}
          <motion.section
            className="mt-10 bg-black/50 p-4 sm:p-6 rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-purple-400" />
                <h2 className="text-base md:text-lg font-medium tracking-tight">Template Problems</h2>
              </div>
              {!loading && problems.length > 4 && (
                <button
                  onClick={() => navigate('/problems')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition font-medium"
                >
                  View All →
                </button>
              )}
            </div>

            {loading && (
              <div className="mt-5 flex items-center justify-center gap-2 text-white/60">
                <Loader2 size={16} className="animate-spin" />
                <span>Loading problems...</span>
              </div>
            )}

            {error && (
              <div className="mt-5 flex items-center justify-center gap-2 text-red-400">
                <AlertCircle size={16} />
                <span>Error: {error}</span>
              </div>
            )}

            {!loading && !error && problems.length === 0 && (
              <div className="mt-5 flex flex-col items-center justify-center gap-2 text-white/60 py-8">
                <Inbox size={28} className="text-white/20" />
                <span>No problems available</span>
              </div>
            )}

            {!loading && problems.length > 0 && (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5">
                {problems.slice(0, 4).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.04 * i }}
                  >
                    <ProblemCard problem={p} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

        </div>
      </div>

      {/* ══════════ CREATE PROJECT MODAL ══════════ */}
      <AnimatePresence>
        {showModal && <NewProject onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}

