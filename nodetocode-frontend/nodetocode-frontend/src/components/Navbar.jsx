// import React from 'react'
// import useAuthStore from '../store/authStore'
// import { Link, useNavigate } from 'react-router-dom'

// export default function Navbar() {
//   const user = useAuthStore((s) => s.user)
//   const logout = useAuthStore((s) => s.logout)
//   const navigate = useNavigate()

//   const handleLogout = async () => {
//     await logout()
//     navigate('/login', { replace: true })
//   }

//   return (
//     <nav className="sticky top-0 z-50 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-b border-white/10">
//       <div className="w-full px-6 md:px-12 lg:px-20 py-4 flex items-center justify-between">

//         {/* Logo */}
//         <Link to="/dashboard" className="flex items-center gap-2">
//           <img
//             src="/assets/logo_main.svg"
//             alt="Logo"
//             className="h-7 md:h-8 w-auto"
//           />
//         </Link>

//         {/* Right Side */}
//         {user && (
//           <div className="flex items-center gap-4">
//             <span className="text-xs md:text-sm font-medium tracking-tight text-slate-800 dark:text-slate-200">
//               {user.name || user.email || 'User'}
//             </span>

//             <button
//               onClick={handleLogout}
//               className="text-xs md:text-sm bg-red-600 hover:bg-red-700 transition px-4 py-1.5 rounded-lg text-white font-medium"
//             >
//               Logout
//             </button>
//           </div>
//         )}
//       </div>
//     </nav>
//   )
// }

import React, { useRef, useEffect } from 'react'
import useAuthStore from '../store/authStore'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Sword } from 'lucide-react'
import { gsap } from 'gsap'

// Spark definitions: angle (deg) + length variant
const SPARKS = [
  { angle: -80, len: 7 }, { angle: -55, len: 5 }, { angle: -30, len: 8 },
  { angle: -10, len: 5 }, { angle: 15,  len: 7 }, { angle: 40,  len: 6 },
  { angle: 65,  len: 8 }, { angle: 90,  len: 5 }, { angle: 115, len: 7 },
  { angle: -105, len: 6 },
]
const SPARK_COLORS = ['#fbbf24','#f97316','#fde68a','#fb923c','#fbbf24','#f97316','#fde68a','#fb923c','#fbbf24','#f97316']

/* ── Arena nav link with clashing swords + spark hover animation ── */
function ArenaNavLink() {
  const location = useLocation()
  const active = location.pathname === '/arena'
  const containerRef = useRef(null)
  const leftSwordRef = useRef(null)
  const rightSwordRef = useRef(null)
  const textRef = useRef(null)
  const sparksRef = useRef([])
  const tlRef = useRef(null)

  useEffect(() => {
    gsap.set(rightSwordRef.current, { scaleX: -1 })
    gsap.set(sparksRef.current, { opacity: 0 })
  }, [])

  const onEnter = () => {
    const container = containerRef.current
    const leftSword = leftSwordRef.current
    const rightSword = rightSwordRef.current
    if (!container || !leftSword || !rightSword) return

    const containerRect = container.getBoundingClientRect()
    const leftRect  = leftSword.getBoundingClientRect()
    const rightRect = rightSword.getBoundingClientRect()
    const centerX   = containerRect.left + containerRect.width / 2

    const leftDx  = centerX - (leftRect.left  + leftRect.width  / 2)
    const rightDx = centerX - (rightRect.left + rightRect.width / 2)

    if (tlRef.current) tlRef.current.kill()
    const tl = gsap.timeline()
    tlRef.current = tl

    // 1. Text fades instantly
    tl.to(textRef.current, { opacity: 0, duration: 0.12, ease: 'power2.in' }, 0)

    // 2. Swords swing inward (rotate + charge) – left tilts CW, right tilts CCW visually
    tl.to(leftSword,  { x: leftDx,  rotation: 38,  scaleX: 1.45, scaleY: 1.45, duration: 0.22, ease: 'power3.in' }, 0)
    tl.to(rightSword, { x: rightDx, rotation: 38,  scaleX: -1.45, scaleY: 1.45, duration: 0.22, ease: 'power3.in' }, 0)

    // 3. Impact: swords recoil slightly
    tl.to(leftSword,  { x: leftDx  - 4, scaleX: 1.3,  scaleY: 1.3,  duration: 0.08, ease: 'power2.out' }, 0.22)
    tl.to(rightSword, { x: rightDx + 4, scaleX: -1.3, scaleY: 1.3,  duration: 0.08, ease: 'power2.out' }, 0.22)

    // 4. Sparks burst from clash point
    sparksRef.current.forEach((spark, i) => {
      if (!spark) return
      const { angle, len } = SPARKS[i]
      const rad  = (angle * Math.PI) / 180
      const dist = len + 8
      tl.fromTo(
        spark,
        { x: 0, y: 0, opacity: 1, scaleX: 1, scaleY: 1 },
        { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, opacity: 0, scaleX: 0.3, scaleY: 0.3, duration: 0.42, ease: 'power2.out' },
        0.22,
      )
    })
  }

  const onLeave = () => {
    if (tlRef.current) tlRef.current.kill()
    gsap.to(textRef.current,      { opacity: 1, duration: 0.2, ease: 'power2.out' })
    gsap.to(leftSwordRef.current,  { x: 0, rotation: 0, scaleX: 1,  scaleY: 1, duration: 0.24, ease: 'power2.inOut' })
    gsap.to(rightSwordRef.current, { x: 0, rotation: 0, scaleX: -1, scaleY: 1, duration: 0.24, ease: 'power2.inOut' })
    gsap.set(sparksRef.current, { opacity: 0 })
  }

  return (
    <Link
      to="/arena"
      ref={containerRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors overflow-visible ${
        active
          ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
          : 'text-white/50 hover:text-white/80 border border-transparent'
      }`}
    >
      {/* Left sword */}
      <span ref={leftSwordRef} className="flex items-center flex-shrink-0">
        <Sword size={13} className={active ? 'text-indigo-400' : ''} />
      </span>

      {/* Spark particles — centred over the button, burst on clash */}
      <span className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 40 }}>
        {SPARKS.map((_, i) => (
          <span
            key={i}
            ref={el => { sparksRef.current[i] = el }}
            className="absolute rounded-full"
            style={{
              width:  i % 3 === 0 ? '5px' : '3px',
              height: '2px',
              background: SPARK_COLORS[i],
              opacity: 0,
              transformOrigin: 'center center',
            }}
          />
        ))}
      </span>

      {/* Text */}
      <span ref={textRef} className="relative z-10">Arena</span>

      {/* Right sword (mirrored) */}
      <span ref={rightSwordRef} className="flex items-center flex-shrink-0">
        <Sword size={13} className={active ? 'text-indigo-400' : ''} />
      </span>

      {active && (
        <span className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-indigo-400" />
      )}
    </Link>
  )
}

export default function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-black/60 backdrop-blur-sm border-b border-white/5">
      <div className="w-full px-5 md:px-12 py-4 flex items-center justify-between">

        <div className="flex items-center gap-5">
          <Link to="/dashboard">
            <img src="/assets/logo_main.svg" alt="Logo" className="h-7 md:h-8" />
          </Link>
          <ArenaNavLink />
        </div>

        {user && (
          <div className="flex items-center gap-3">

            <span className="hidden sm:block text-sm text-white/80">
              {user.name || user.email}
            </span>

            {/* Mobile = icon only */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center sm:hidden p-2 rounded-lg bg-red-600/90 hover:bg-red-600 transition"
            >
              <LogOut size={18} />
            </button>

            {/* Desktop = text button */}
            <button
              onClick={handleLogout}
              className="hidden sm:block text-sm bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-lg transition"
            >
              Logout
            </button>

          </div>
        )}
      </div>
    </nav>
  )
}