'use client'
 
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
 
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-red-100 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-red-400" />
        
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-black text-gray-800 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-8">
          We hit a small bump in the road. Don't worry, your progress is saved.
        </p>
        
        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>
      </motion.div>
    </div>
  )
}
