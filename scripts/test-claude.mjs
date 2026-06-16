import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    process.env[key] = value
  }
}

loadEnv(path.resolve(__dirname, '../.env.local'))

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function tryModel(model) {
  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Responda apenas: OK' }],
    })
    console.log(`✓ ${model} -> FUNCIONA:`, response.content[0].text)
    return true
  } catch (err) {
    console.error(`✗ ${model} -> ${err.status} ${err.message}`)
    return false
  }
}

async function main() {
  const candidates = [
    'claude-sonnet-4-6',
    'claude-sonnet-4-5',
    'claude-sonnet-4-5-20250929',
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-latest',
    'claude-3-7-sonnet-latest',
    'claude-opus-4-1-20250805',
  ]
  for (const m of candidates) {
    await tryModel(m)
  }
}

main()
