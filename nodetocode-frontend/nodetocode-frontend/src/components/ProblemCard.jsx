import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function ProblemCard({ problem }) {
  const getDifficultyStyle = (d) => {
    const k = d?.toLowerCase()
    if (k === 'easy') {
      return {
        border: 'border-blue-500',
        text: 'text-blue-400'
      }
    }
    if (k === 'medium') {
      return {
        border: 'border-transparent',
        text: 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent',
        wrapper: 'bg-gradient-to-r from-blue-500 to-purple-500 p-[2px]'
      }
    }
    if (k === 'hard') {
      return {
        border: 'border-purple-500',
        text: 'text-purple-400'
      }
    }
    return {
      border: 'border-gray-500',
      text: 'text-gray-400'
    }
  }

  const style = getDifficultyStyle(problem.difficulty)
  const isMedium = problem.difficulty?.toLowerCase() === 'medium'

  return (
    <motion.article
      className="bg-black rounded-xl p-4 border border-white/10 flex flex-col justify-between hover:border-white/30 transition-all"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {isMedium ? (
            <span className={`${style.wrapper} rounded-full`}>
              <span className="bg-black text-[10px] px-2 py-0.5 rounded-full font-medium block">
                <span className={style.text}>{problem.difficulty}</span>
              </span>
            </span>
          ) : (
            <span className={`${style.border} ${style.text} bg-black text-[10px] px-2 py-0.5 rounded-full font-medium border-2`}>
              {problem.difficulty}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold text-white line-clamp-2">{problem.title}</h3>
      </div>
      <div className="mt-4 flex items-center justify-end">
        <Link 
          to={`/problems/${problem.id}`} 
          className="text-white/70 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5 group"
        >
          <span>Solve</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </motion.article>
  )
}
