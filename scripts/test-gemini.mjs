import { GoogleGenerativeAI } from '@google/generative-ai'
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function tryModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName })
    const result = await model.generateContent('Responda apenas: OK')
    console.log(`✓ ${modelName} -> FUNCIONA:`, result.response.text())
    return true
  } catch (err) {
    console.error(`✗ ${modelName} -> ${err.message.slice(0, 150)}`)
    return false
  }
}

async function main() {
  console.log('Key prefix:', process.env.GEMINI_API_KEY?.slice(0, 10))
  const candidates = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-flash-latest',
  ]
  for (const m of candidates) {
    await tryModel(m)
  }
}

main()
