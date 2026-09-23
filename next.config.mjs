// build cache bust: 2026-06-16
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

// Copia o worker do PDF.js para public/ ao iniciar dev ou build
const workerSrc = resolve(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
const workerDest = resolve(process.cwd(), 'public/pdf.worker.min.mjs')
try {
  mkdirSync(resolve(process.cwd(), 'public'), { recursive: true })
  if (!existsSync(workerDest)) {
    copyFileSync(workerSrc, workerDest)
    console.log('[setup] PDF.js worker copiado para public/')
  }
} catch (e) {
  console.warn('[setup] Não foi possível copiar PDF worker:', e.message)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js', '@supabase/ssr', 'pdf-parse', 'pdf-lib'],
  },
}

export default nextConfig
