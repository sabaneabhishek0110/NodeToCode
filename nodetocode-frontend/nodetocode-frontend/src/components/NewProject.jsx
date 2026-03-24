import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Coffee, Code2, Zap, Globe } from 'lucide-react'
import useProjectStore from '../store/projectStore'

const languages = [
  { value: 'JAVA', label: 'Java', Icon: Coffee },
  { value: 'PYTHON', label: 'Python', Icon: Code2 },
  { value: 'CPP', label: 'C++', Icon: Zap },
  { value: 'JAVASCRIPT', label: 'JavaScript', Icon: Globe },
]

export default function NewProject({ onClose }) {
  const createProject = useProjectStore((s) => s.createProject)

  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formLang, setFormLang] = useState('JAVA')
  const [submitting, setSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formTitle.trim()) return
    setSubmitting(true)
    const result = await createProject({
      title: formTitle.trim(),
      description: formDesc.trim(),
      language: formLang,
    })
    setSubmitting(false)
    if (result) onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal */}
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[92vw] max-w-[440px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-[0_0_80px_rgba(59,130,246,0.08),0_0_80px_rgba(147,51,234,0.08)]"
        initial={{ scale: 0.92, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Gradient border shimmer at top */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, #a855f7, transparent)' }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        />

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2.5"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/[0.06]">
                <Sparkles size={14} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">New Project</h3>
                <p className="text-[10px] text-white/30 mt-0.5">Create something amazing</p>
              </div>
            </motion.div>
            <motion.button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-white/30 hover:text-white/80 hover:bg-white/[0.08] transition-all"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={14} />
            </motion.button>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Title</label>
            <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'title' ? 'ring-1 ring-blue-500/30' : ''}`}>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                placeholder="My awesome project"
                required
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white/[0.03] text-white border border-white/[0.06] placeholder-white/20 focus:bg-white/[0.05] focus:border-white/[0.1] focus:outline-none transition-all"
              />
            </div>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.28 }}
          >
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Description</label>
            <div className={`relative rounded-xl transition-all duration-300 ${focusedField === 'desc' ? 'ring-1 ring-purple-500/30' : ''}`}>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                onFocus={() => setFocusedField('desc')}
                onBlur={() => setFocusedField(null)}
                placeholder="What is this project about?"
                rows={3}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white/[0.03] text-white border border-white/[0.06] placeholder-white/20 focus:bg-white/[0.05] focus:border-white/[0.1] focus:outline-none transition-all resize-none"
              />
            </div>
          </motion.div>

          {/* Language selector */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.36 }}
          >
            <label className="block text-[11px] font-medium text-white/40 mb-2 uppercase tracking-wider">Language</label>
            <div className="grid grid-cols-4 gap-2">
              {languages.map((lang) => (
                <motion.button
                  key={lang.value}
                  type="button"
                  onClick={() => setFormLang(lang.value)}
                  className={`relative flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs transition-all ${
                    formLang === lang.value
                      ? 'bg-white/[0.06] border-blue-500/30 text-white shadow-[0_0_20px_rgba(59,130,246,0.08)]'
                      : 'bg-white/[0.02] border-white/[0.04] text-white/40 hover:bg-white/[0.04] hover:text-white/60'
                  }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <lang.Icon size={18} />
                  <span className="font-medium text-[10px]">{lang.label}</span>
                  {formLang === lang.value && (
                    <motion.div
                      className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                      layoutId="langIndicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.44 }}
            className="pt-1"
          >
            <motion.button
              type="submit"
              disabled={submitting || !formTitle.trim()}
              className="relative w-full py-2.5 rounded-xl text-sm font-medium overflow-hidden disabled:opacity-30 transition-all text-white group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Button gradient bg */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500 transition-all" />
              {/* Shine effect on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              <span className="relative flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <motion.div
                      className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Create Project
                  </>
                )}
              </span>
            </motion.button>
          </motion.div>
        </form>

        {/* Bottom gradient glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </motion.div>
    </motion.div>
  )
}
