import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { LayoutDashboard, BookOpen, FolderKanban, User, LogOut } from 'lucide-react'
import useAuthStore from '../store/authStore'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard',
    accent: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
  { label: 'Problems', icon: BookOpen, path: '/problems',
    accent: '#8b5cf6', glow: 'rgba(139,92,246,0.35)' },
  { label: 'Projects', icon: FolderKanban, path: '/projects',
    accent: '#a855f7', glow: 'rgba(168,85,247,0.35)' },
  { label: 'Profile', icon: User, path: '/profile',
    accent: '#06b6d4', glow: 'rgba(6,182,212,0.35)' },
]

/* ── Responsive breakpoint helper ── */
function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return mobile
}

/* ══════════════════════════════════════════════════════════
   NavItem – Corner bracket borders on hover, filled for active
   ══════════════════════════════════════════════════════════ */
function NavItem({ item, active, isMobile, onClick, delayIdx }) {
  const containerRef = useRef(null)
  const cornersRef = useRef([])
  const iconRef = useRef(null)
  const glowRef = useRef(null)
  const labelRef = useRef(null)

  const cs = 7   // corner size px
  const ct = 1.5 // corner thickness px

  const cornerStyles = [
    { top: 0, left: 0, borderTop: `${ct}px solid ${item.accent}`, borderLeft: `${ct}px solid ${item.accent}`, borderRadius: '4px 0 0 0' },
    { top: 0, right: 0, borderTop: `${ct}px solid ${item.accent}`, borderRight: `${ct}px solid ${item.accent}`, borderRadius: '0 4px 0 0' },
    { bottom: 0, left: 0, borderBottom: `${ct}px solid ${item.accent}`, borderLeft: `${ct}px solid ${item.accent}`, borderRadius: '0 0 0 4px' },
    { bottom: 0, right: 0, borderBottom: `${ct}px solid ${item.accent}`, borderRight: `${ct}px solid ${item.accent}`, borderRadius: '0 0 4px 0' },
  ]

  /* Keep corners synced with active state */
  useEffect(() => {
    cornersRef.current.forEach((el) => {
      if (!el) return
      gsap.set(el, { opacity: active ? 1 : 0, scale: active ? 1 : 0 })
    })
  }, [active])

  const onEnter = () => {
    if (active) return
    cornersRef.current.forEach((el, i) => {
      if (!el) return
      gsap.killTweensOf(el)
      gsap.fromTo(el,
        { opacity: 0, scale: 0 },
        { opacity: 1, scale: 1, duration: 0.35, delay: i * 0.045, ease: 'back.out(3)' }
      )
    })
    if (iconRef.current) {
      gsap.to(iconRef.current, { scale: 1.18, rotation: 10, duration: 0.3, ease: 'back.out(2)' })
      gsap.to(iconRef.current, { color: item.accent, duration: 0.2 })
    }
    if (labelRef.current) {
      gsap.to(labelRef.current, { color: '#fff', duration: 0.2 })
    }
    if (glowRef.current) {
      gsap.to(glowRef.current, { opacity: 0.5, duration: 0.3 })
    }
    if (containerRef.current) {
      gsap.to(containerRef.current, { y: -2, duration: 0.25, ease: 'power2.out' })
    }
  }

  const onLeave = () => {
    if (active) return
    cornersRef.current.forEach((el) => {
      if (!el) return
      gsap.killTweensOf(el)
      gsap.to(el, { opacity: 0, scale: 0, duration: 0.2, ease: 'power2.in' })
    })
    if (iconRef.current) {
      gsap.to(iconRef.current, { scale: 1, rotation: 0, color: 'rgba(255,255,255,0.5)', duration: 0.25 })
    }
    if (labelRef.current) {
      gsap.to(labelRef.current, { color: 'rgba(255,255,255,0.5)', duration: 0.2 })
    }
    if (glowRef.current) {
      gsap.to(glowRef.current, { opacity: 0, duration: 0.2 })
    }
    if (containerRef.current) {
      gsap.to(containerRef.current, { y: 0, duration: 0.25, ease: 'power2.out' })
    }
  }

  const Icon = item.icon

  return (
    <motion.div
      ref={containerRef}
      className={`relative cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg
        ${isMobile ? 'p-2.5' : 'px-4 sm:px-5 py-2.5'}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 10, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30, delay: delayIdx * 0.04 }}
      title={item.label}
    >
      {/* Four corner brackets */}
      {cornerStyles.map((style, i) => (
        <div
          key={i}
          ref={(el) => (cornersRef.current[i] = el)}
          className="absolute pointer-events-none"
          style={{ width: cs, height: cs, opacity: 0, ...style }}
        />
      ))}

      {/* Radial glow on hover */}
      <div
        ref={glowRef}
        className="absolute inset-0 rounded-lg pointer-events-none opacity-0"
        style={{ background: `radial-gradient(ellipse at center, ${item.glow} 0%, transparent 75%)` }}
      />

      {/* Active state: subtle tinted bg + animated bottom bar + permanent corners */}
      {active && (
        <>
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{ background: `${item.accent}18` }}
          />
          <motion.div
            layoutId="floating-nav-active-bar"
            className="absolute -bottom-[2px] left-[18%] right-[18%] h-[2px] rounded-full pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${item.accent}, transparent)`,
              boxShadow: `0 0 10px ${item.glow}, 0 2px 6px ${item.glow}`,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </>
      )}

      {/* Icon */}
      <div ref={iconRef} style={{ color: active ? item.accent : 'rgba(255,255,255,0.5)' }}>
        <Icon size={isMobile ? 17 : 16} strokeWidth={active ? 2.4 : 1.8} />
      </div>

      {/* Label (desktop only) */}
      {!isMobile && (
        <span
          ref={labelRef}
          className="text-[11px] sm:text-xs font-semibold tracking-wide whitespace-nowrap"
          style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}
        >
          {item.label}
        </span>
      )}
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   FloatingNav – Main wrapper
   ══════════════════════════════════════════════════════════ */
export default function FloatingNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pillRef = useRef(null)
  const dotsRef = useRef([])
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const isMobile = useIsMobile()

  /* ── Dimensions based on breakpoint ── */
  const collapsedW = isMobile ? 60 : 72
  const collapsedH = isMobile ? 28 : 32
  const expandedW = isMobile ? 340 : 620
  const expandedH = isMobile ? 60 : 72

  /* ── Open / close (tap on mobile, hover on desktop) ── */
  const open = useCallback(() => {
    setIsOpen(true)
    dotsRef.current.forEach((dot, i) => {
      if (!dot) return
      gsap.to(dot, {
        scale: 0,
        opacity: 0,
        y: -10 + Math.random() * 20,
        x: -8 + Math.random() * 16,
        duration: 0.25,
        delay: i * 0.03,
        ease: 'power2.in',
      })
    })
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    dotsRef.current.forEach((dot, i) => {
      if (!dot) return
      gsap.to(dot, {
        scale: 1,
        opacity: 1,
        y: 0,
        x: 0,
        duration: 0.35,
        delay: i * 0.04,
        ease: 'elastic.out(1,0.5)',
      })
    })
  }, [])

  const toggle = useCallback(() => {
    isOpen ? close() : open()
  }, [isOpen, open, close])

  /* ── Close on outside tap (mobile) ── */
  const containerRef = useRef(null)
  useEffect(() => {
    if (!isMobile || !isOpen) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) close()
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [isMobile, isOpen, close])

  const handleNav = (item) => {
    navigate(item.path)
    setIsOpen(false)
    setTimeout(() => {
      dotsRef.current.forEach((dot) => {
        if (!dot) return
        gsap.set(dot, { scale: 1, opacity: 1, y: 0, x: 0 })
      })
    }, 100)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const isActive = (item) => location.pathname === item.path

  return (
    <>
      <div
        ref={containerRef}
        className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-[100]"
        onMouseEnter={!isMobile ? open : undefined}
        onMouseLeave={!isMobile ? close : undefined}
        onClick={isMobile && !isOpen ? toggle : undefined}
      >
        <motion.div ref={pillRef} className="relative cursor-pointer" layout>
          {/* Background pill / expanded panel */}
          <motion.div
            layout
            className="overflow-hidden backdrop-blur-xl border border-white/[0.06]"
            style={{ borderRadius: 50 }}
            initial={false}
            animate={
              isOpen
                ? {
                    width: expandedW,
                    height: expandedH,
                    backgroundColor: 'rgba(10,10,10,0.85)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                  }
                : {
                    width: collapsedW,
                    height: collapsedH,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }
            }
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
          >
            {/* ── Dots (visible when collapsed) ── */}
            <div className="absolute inset-0 flex items-center justify-center gap-[5px] sm:gap-[6px] pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  ref={(el) => (dotsRef.current[i] = el)}
                  className="w-1 h-1 sm:w-[5px] sm:h-[5px] rounded-full bg-white/70"
                />
              ))}
            </div>

            {/* ── Expanded Nav Items ── */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center gap-0 sm:gap-0.5 px-2 sm:px-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, delay: 0.1 }}
                >
                  {NAV_ITEMS.map((item, idx) => (
                    <NavItem
                      key={item.label}
                      item={item}
                      active={isActive(item)}
                      isMobile={isMobile}
                      onClick={() => handleNav(item)}
                      delayIdx={idx}
                    />
                  ))}

                  {/* Divider */}
                  <div className="w-px h-4 sm:h-5 bg-white/[0.08] mx-0.5 sm:mx-1" />

                  {/* Logout */}
                  <motion.button
                    onClick={handleLogout}
                    className="flex items-center justify-center p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.22 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Logout"
                  >
                    <LogOut size={isMobile ? 15 : 14} strokeWidth={1.8} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
