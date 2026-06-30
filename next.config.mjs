// build cache bust: 2026-06-16
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js', '@supabase/ssr', 'pdf-parse', 'pdfjs-dist'],
  },
}

export default nextConfig
