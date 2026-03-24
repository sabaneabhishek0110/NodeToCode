import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { GoogleLogin } from '@react-oauth/google'
import useAuthStore from '../store/authStore'
import { Code2, GitBranch, Play, Layers, Zap, Shield, ArrowDown, Terminal, Cpu, Globe, Sparkles, MousePointer2, Box } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

/* ───── Reusable fade-in section wrapper ───── */
function Section({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  )
}

/* ───── Floating particle background ───── */
function Particles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '96,165,250' : '168,85,247',
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`
        ctx.fill()
      }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

/* ───── Animated code block ───── */
function AnimatedCode() {
  const lines = [
    { indent: 0, text: 'public class Main {', color: 'text-blue-400' },
    { indent: 1, text: 'public static void main(String[] args) {', color: 'text-purple-400' },
    { indent: 2, text: '// Built with NodeToCode', color: 'text-white/30' },
    { indent: 2, text: 'System.out.println("Hello World");', color: 'text-emerald-400' },
    { indent: 1, text: '}', color: 'text-purple-400' },
    { indent: 0, text: '}', color: 'text-blue-400' },
  ]
  return (
    <div className="bg-black/80 border border-white/10 rounded-xl p-5 font-mono text-sm overflow-hidden backdrop-blur-sm">
      <div className="flex items-center gap-1.5 mb-4">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        <span className="ml-2 text-[10px] text-white/20">Main.java</span>
      </div>
      {lines.map((l, i) => (
        <motion.div
          key={i}
          className={`${l.color}`}
          style={{ paddingLeft: `${l.indent * 1.5}rem` }}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.12, ease: 'easeOut' }}
        >
          {l.text}
        </motion.div>
      ))}
      <motion.div
        className="mt-1 w-2 h-4 bg-white/60 inline-block"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
      />
    </div>
  )
}

/* ───── Multi-language code tabs ───── */
function MultiLangCode() {
  const [tab, setTab] = useState(0)
  const langs = [
    { name: 'Python', file: 'solve.py', color: 'text-yellow-400', lines: [
      { t: 'def solve(n):', c: 'text-blue-400' },
      { t: '    if n <= 1:', c: 'text-purple-400' },
      { t: '        return n', c: 'text-emerald-400' },
      { t: '    return solve(n-1) + solve(n-2)', c: 'text-emerald-400' },
    ]},
    { name: 'C++', file: 'main.cpp', color: 'text-blue-400', lines: [
      { t: '#include <iostream>', c: 'text-purple-400' },
      { t: 'int fib(int n) {', c: 'text-blue-400' },
      { t: '    return n <= 1 ? n : fib(n-1)+fib(n-2);', c: 'text-emerald-400' },
      { t: '}', c: 'text-blue-400' },
    ]},
    { name: 'JavaScript', file: 'index.js', color: 'text-amber-400', lines: [
      { t: 'const solve = (n) => {', c: 'text-blue-400' },
      { t: '  if (n <= 1) return n;', c: 'text-purple-400' },
      { t: '  return solve(n - 1) + solve(n - 2);', c: 'text-emerald-400' },
      { t: '};', c: 'text-blue-400' },
    ]},
  ]
  const active = langs[tab]
  return (
    <div className="bg-black/80 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
      <div className="flex border-b border-white/5">
        {langs.map((l, i) => (
          <button key={l.name} onClick={() => setTab(i)}
            className={`px-4 py-2 text-[11px] font-medium transition-all ${tab === i ? 'text-white bg-white/5 border-b border-blue-500' : 'text-white/30 hover:text-white/50'}`}>
            {l.name}
          </button>
        ))}
      </div>
      <div className="p-5 font-mono text-sm">
        <div className="text-[10px] text-white/20 mb-3">{active.file}</div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {active.lines.map((l, i) => (
              <div key={i} className={l.c}>{l.t}</div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ───── Feature card ───── */
function FeatureCard({ icon: Icon, title, desc, i }) {
  return (
    <motion.div
      className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/30 via-transparent to-purple-500/30"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: i * 0.1 }}
      whileHover={{ scale: 1.03 }}
    >
      <div className="rounded-2xl bg-black/70 backdrop-blur-md p-6 h-full border border-white/5">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
          <Icon size={20} className="text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
        <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

/* ───── Workflow step ───── */
function Step({ num, title, desc, i }) {
  return (
    <motion.div
      className="flex gap-5 items-start"
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: i * 0.15 }}
    >
      <div className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
        {num}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
        <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

/* ───── Animated counter ───── */
function Counter({ value, suffix = '', label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = 0
    const end = value
    const duration = 1500
    const step = Math.ceil(end / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, value])
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        {count}{suffix}
      </div>
      <div className="text-xs text-white/40 mt-1">{label}</div>
    </div>
  )
}

/* ───── Fake node graph SVG ───── */
function NodeGraphDemo() {
  const nodes = [
    { x: 60, y: 40, label: 'Input', color: '#3b82f6' },
    { x: 220, y: 30, label: 'Parse', color: '#8b5cf6' },
    { x: 220, y: 100, label: 'Validate', color: '#8b5cf6' },
    { x: 380, y: 65, label: 'Logic', color: '#10b981' },
    { x: 540, y: 65, label: 'Output', color: '#f59e0b' },
  ]
  const edges = [[0,1],[0,2],[1,3],[2,3],[3,4]]
  return (
    <svg viewBox="0 0 600 140" className="w-full" fill="none">
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x + 40} y1={nodes[a].y + 15}
          x2={nodes[b].x} y2={nodes[b].y + 15}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.g key={i}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 + i * 0.12 }}
        >
          <rect x={n.x} y={n.y} width="80" height="30" rx="8" fill={n.color} fillOpacity="0.15" stroke={n.color} strokeOpacity="0.4" strokeWidth="1" />
          <text x={n.x + 40} y={n.y + 19} textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace" opacity="0.7">{n.label}</text>
        </motion.g>
      ))}
      {/* Animated pulse along edge */}
      <motion.circle r="3" fill="#60a5fa"
        animate={{ cx: [100, 220, 380, 540], cy: [55, 45, 80, 80], opacity: [1, 0.8, 0.8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  )
}

/* ───── Testimonial card ───── */
function TestimonialCard({ name, role, text, i }) {
  return (
    <motion.div
      className="rounded-2xl bg-white/[0.03] border border-white/5 p-6 backdrop-blur-sm"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: i * 0.1 }}
    >
      <p className="text-xs text-white/50 leading-relaxed mb-4 italic">&ldquo;{text}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
          {name.charAt(0)}
        </div>
        <div>
          <div className="text-xs font-medium text-white/80">{name}</div>
          <div className="text-[10px] text-white/30">{role}</div>
        </div>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════════════
   MAIN LOGIN PAGE
   ════════════════════════════════════════════════════ */
export default function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const error = useAuthStore((s) => s.error)
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const guestLogin = useAuthStore((s) => s.guestLogin)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/dashboard'
  const wrapperRef = useRef(null)
  const heroRef = useRef(null)
  const lenisRef = useRef(null)

  /* ── redirect if already logged in ── */
  useEffect(() => { fetchCurrentUser() }, [fetchCurrentUser])
  useEffect(() => { if (user) navigate(from, { replace: true }) }, [user, navigate, from])

  /* ── Lenis smooth scroll (wrapper-based, scoped to this page only) ── */
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const lenis = new Lenis({
      wrapper,
      content: wrapper,
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.lagSmoothing(0)
    gsap.ticker.add((time) => lenis.raf(time * 1000))

    return () => {
      gsap.ticker.remove(lenis.raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  /* ── GSAP hero text reveal ── */
  useEffect(() => {
    if (!heroRef.current) return
    const chars = heroRef.current.querySelectorAll('.hero-char')
    gsap.fromTo(chars,
      { opacity: 0, y: 40, rotateX: -60 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.03, ease: 'back.out(1.4)', delay: 0.3 }
    )
  }, [])

  /* ── GSAP horizontal scroll section ── */
  const hScrollRef = useRef(null)
  const hTrackRef = useRef(null)
  useEffect(() => {
    const section = hScrollRef.current
    const track = hTrackRef.current
    if (!section || !track) return
    const totalScroll = track.scrollWidth - section.offsetWidth
    const tween = gsap.to(track, {
      x: -totalScroll,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        scroller: wrapperRef.current,
        start: 'top top',
        end: () => `+=${totalScroll}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    })
    return () => { tween.scrollTrigger?.kill(); tween.kill() }
  }, [])

  /* ── Parallax for hero ── */
  const { scrollYProgress } = useScroll({ container: wrapperRef })
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -120])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])

  /* ── Split text helper ── */
  const splitChars = (text) =>
    text.split('').map((ch, i) => (
      <span key={i} className="hero-char inline-block" style={{ perspective: '600px' }}>
        {ch === ' ' ? '\u00A0' : ch}
      </span>
    ))

  /* ── Scroll to element helper ── */
  const scrollToId = (id) => {
    const el = document.getElementById(id)
    if (!el || !lenisRef.current) return
    const wrapper = wrapperRef.current
    const elTop = el.getBoundingClientRect().top + wrapper.scrollTop - wrapper.getBoundingClientRect().top
    lenisRef.current.scrollTo(elTop, { duration: 1.6 })
  }

  const features = [
    { icon: Layers, title: 'Visual Node Editor', desc: 'Drag-and-drop nodes to build logic visually. Connect blocks to form your program flow.' },
    { icon: Code2, title: 'Live Code Editor', desc: 'Full Monaco code editor with syntax highlighting, IntelliSense, and a pure-black theme.' },
    { icon: Play, title: 'Instant Execution', desc: 'Run your code against custom test cases with a single click. See results instantly.' },
    { icon: GitBranch, title: 'Multi-Language', desc: 'Write in Java, Python, C++, or JavaScript. Switch languages seamlessly.' },
    { icon: Zap, title: 'Template Problems', desc: 'Practice with curated coding challenges. Test your logic before building real projects.' },
    { icon: Shield, title: 'Cloud Projects', desc: 'Save projects to your account. Access them anywhere, anytime.' },
  ]

  const steps = [
    { title: 'Create a Project', desc: 'Pick a language and start a new project, or dive into a template problem.' },
    { title: 'Build with Nodes or Code', desc: 'Use the visual node editor to design logic, or write code directly in the editor.' },
    { title: 'Add Test Cases', desc: 'Define inputs and expected outputs. Validate your solution with custom test cases.' },
    { title: 'Run & Iterate', desc: 'Execute code instantly, check results, fix bugs, and repeat until it is perfect.' },
  ]

  const testimonials = [
    { name: 'Alex Chen', role: 'CS Student', text: 'NodeToCode completely changed how I approach algorithm design. The visual editor makes complex logic so much easier to understand.' },
    { name: 'Priya Sharma', role: 'Software Engineer', text: 'Being able to switch between nodes and code is incredibly powerful. I use it to prototype ideas before writing production code.' },
    { name: 'Marcus Johnson', role: 'Bootcamp Grad', text: 'The instant execution and test case features saved me hours of debugging. Best coding playground I have used online.' },
  ]

  const techStack = [
    { icon: Terminal, label: 'Monaco Editor' },
    { icon: Box, label: 'React Flow' },
    { icon: Cpu, label: 'Judge0 CE' },
    { icon: Globe, label: 'Spring Boot' },
    { icon: Sparkles, label: 'Framer Motion' },
    { icon: MousePointer2, label: 'Node Editor' },
  ]

  const horizontalCards = [
    { title: 'Drag. Connect. Code.', desc: 'Build algorithms visually by connecting logic nodes. Each node is a building block of your program.', gradient: 'from-blue-600/20 to-blue-800/20' },
    { title: 'Write Real Code', desc: 'Not just pseudocode. Every node compiles to real Java, Python, C++, or JavaScript.', gradient: 'from-purple-600/20 to-purple-800/20' },
    { title: 'Test Everything', desc: 'Add multiple test cases with expected outputs. Know instantly if your code is correct.', gradient: 'from-emerald-600/20 to-emerald-800/20' },
    { title: 'Ship It', desc: 'Export your code, share your projects, and keep building. Your workspace, your rules.', gradient: 'from-amber-600/20 to-amber-800/20' },
  ]

  const onGoogleSuccess = (credentialResponse) => loginWithGoogle(credentialResponse)

  return (
    <div
      ref={wrapperRef}
      className="h-screen overflow-y-auto overflow-x-hidden relative bg-black text-white scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ scrollBehavior: 'auto' }}
    >
      <Particles />

      {/* ═══ HERO ═══ */}
      <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 translate-y-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

          <motion.div
            className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-widest text-white/50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Visual Code Builder
          </motion.div>

          <h1 ref={heroRef} className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-5">
            <span className="block">{splitChars('Node')}<span className="hero-char inline-block text-blue-400">To</span>{splitChars('Code')}</span>
          </h1>

          <motion.p
            className="text-sm md:text-base text-white/50 max-w-lg leading-relaxed mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
          >
            Design logic visually with nodes, write code, execute instantly,
            and solve problems — all in one powerful dark-themed workspace.
          </motion.p>

          <motion.div
            className="flex items-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <button onClick={() => scrollToId('login-section')}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-600/20">
              Get Started
            </button>
            <button onClick={() => scrollToId('features-section')}
              className="px-6 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/70 text-xs font-medium hover:bg-white/10 transition">
              Learn More
            </button>
          </motion.div>

          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowDown size={18} className="text-white/20" />
          </motion.div>
        </div>
      </motion.div>

      {/* ═══ NODE GRAPH DEMO ═══ */}
      <Section className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-10">
          <motion.h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            Think in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">nodes</span>, export as code
          </motion.h2>
          <p className="text-sm text-white/40 max-w-md mx-auto">Connect visual blocks to build your program flow. Watch data pulse through your logic in real-time.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-sm p-6">
          <NodeGraphDemo />
        </div>
      </Section>

      {/* ═══ CODE PREVIEW ═══ */}
      <Section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <motion.h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              Code meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">visual design</span>
            </motion.h2>
            <motion.p className="text-sm text-white/50 leading-relaxed mb-6"
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
              Switch between a powerful Monaco code editor and an intuitive node-based
              visual builder. Build logic your way — type it or drag it.
            </motion.p>
            <motion.div className="flex gap-3"
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}>
              {['Java', 'Python', 'C++', 'JavaScript'].map((lang) => (
                <span key={lang} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/60">{lang}</span>
              ))}
            </motion.div>
          </div>
          <AnimatedCode />
        </div>
      </Section>

      {/* ═══ FEATURES ═══ */}
      <section id="features-section" className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <Section>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">build & run</span>
            </h2>
            <p className="text-sm text-white/40 max-w-md mx-auto">A complete environment for coding, testing, and iterating — without leaving your browser.</p>
          </div>
        </Section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} i={i} />
          ))}
        </div>
      </section>

      {/* ═══ MULTI-LANG CODE DEMO ═══ */}
      <Section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <MultiLangCode />
          <div>
            <motion.h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              One problem, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">any language</span>
            </motion.h2>
            <motion.p className="text-sm text-white/50 leading-relaxed"
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
              Write solutions in your preferred language. Switch between Java, Python, C++, and JavaScript
              without losing your flow. Each language compiles and runs in isolated sandboxes.
            </motion.p>
          </div>
        </div>
      </Section>

      {/* ═══ HORIZONTAL SCROLL SHOWCASE ═══ */}
      <div ref={hScrollRef} className="relative z-10 h-screen overflow-hidden">
        <div ref={hTrackRef} className="flex h-full items-center gap-8 px-12" style={{ width: 'max-content' }}>
          <div className="w-[40vw] shrink-0 pr-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">workflow</span>
            </h2>
            <p className="text-sm text-white/40">Scroll to see how it all comes together.</p>
          </div>
          {horizontalCards.map((card, i) => (
            <div key={i} className={`shrink-0 w-[70vw] sm:w-[45vw] md:w-[35vw] h-[60vh] rounded-2xl bg-gradient-to-br ${card.gradient} border border-white/5 backdrop-blur-sm p-8 flex flex-col justify-end`}>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-2">0{i + 1}</div>
              <h3 className="text-xl font-bold mb-2">{card.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ STATS ═══ */}
      <Section className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <Counter value={4} suffix="" label="Languages Supported" />
          <Counter value={100} suffix="%" label="Browser-Based" />
          <Counter value={50} suffix="ms" label="Avg Execution Time" />
          <Counter value={0} suffix="" label="Install Required" />
        </div>
      </Section>

      {/* ═══ HOW IT WORKS ═══ */}
      <Section className="relative z-10 max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            How it <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">works</span>
          </h2>
          <p className="text-sm text-white/40 max-w-sm mx-auto">From idea to execution in four simple steps.</p>
        </div>
        <div className="space-y-8 pl-2">
          {steps.map((s, i) => (
            <Step key={s.title} num={i + 1} {...s} i={i} />
          ))}
        </div>
      </Section>

      {/* ═══ TECH STACK ORBIT ═══ */}
      <Section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">modern tech</span>
          </h2>
          <p className="text-sm text-white/40">Built with the tools that professionals trust.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {techStack.map(({ icon: Icon, label }, i) => (
            <motion.div key={label}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <Icon size={22} className="text-white/40" />
              <span className="text-[10px] text-white/50 font-medium">{label}</span>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ═══ TESTIMONIALS ═══ */}
      <Section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">developers</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} {...t} i={i} />
          ))}
        </div>
      </Section>

      {/* ═══ MARQUEE TICKERS (double) ═══ */}
      <div className="relative z-10 py-12 overflow-hidden space-y-4">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[...Array(3)].flatMap((_, k) =>
            ['Node Editor', 'Monaco IDE', 'Instant Run', 'Java', 'Python', 'C++', 'JavaScript'].map((t, i) => (
              <span key={`a${k}-${i}`} className="text-lg md:text-xl font-semibold text-white/[0.04] uppercase tracking-widest">{t}</span>
            ))
          )}
        </div>
        <div className="flex gap-12 animate-marquee-reverse whitespace-nowrap">
          {[...Array(3)].flatMap((_, k) =>
            ['Cloud Projects', 'Custom Tests', 'Dark Theme', 'Visual Blocks', 'Real-time', 'Export Code'].map((t, i) => (
              <span key={`b${k}-${i}`} className="text-lg md:text-xl font-semibold text-white/[0.04] uppercase tracking-widest">{t}</span>
            ))
          )}
        </div>
      </div>

      {/* ═══ BIG CTA SECTION ═══ */}
      <Section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <motion.h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">build</span>?
        </motion.h2>
        <motion.p className="text-sm text-white/40 mb-8 max-w-md mx-auto"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
          Jump in, create a project, drag some nodes, write some code — and ship it.
          No setup required. Just open and go.
        </motion.p>
        <motion.button onClick={() => scrollToId('login-section')}
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-600/20"
          initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          Get Started Now
        </motion.button>
      </Section>

      {/* ═══ LOGIN SECTION ═══ */}
      <section id="login-section" className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-8 shadow-2xl shadow-blue-600/5">
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 items-center justify-center mb-4 shadow-lg shadow-blue-600/20"
                initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Code2 size={22} className="text-white" />
              </motion.div>
              <h2 className="text-xl font-bold tracking-tight mb-1">Welcome to NodeToCode</h2>
              <p className="text-xs text-white/40">Sign in to save your projects and access them anywhere.</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                >
                  {String(error)}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center mb-4">
              <GoogleLogin
                onSuccess={onGoogleSuccess}
                onError={() => console.error('Google login failed')}
                theme="filled_black"
                shape="pill"
                size="large"
                width="320"
              />
            </div>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              onClick={guestLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/70 hover:text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Continue as Guest'
              )}
            </button>

            <p className="mt-6 text-[10px] text-white/20 text-center leading-relaxed">
              By continuing you agree to our terms and privacy policy.<br />
              Guest sessions are temporary. Sign in with Google to save your work.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="text-[10px] text-white/20">&copy; 2026 NodeToCode — Built with React, Monaco, and creativity.</p>
      </footer>

      {/* Animations CSS */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.33%); }
        }
        @keyframes marquee-reverse {
          from { transform: translateX(-33.33%); }
          to { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 20s linear infinite;
        }
      `}</style>
    </div>
  )
}
