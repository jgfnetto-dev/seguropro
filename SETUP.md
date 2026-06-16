# SeguroPro — Setup Guide

## 1. Supabase

1. Create a new project at supabase.com
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Create Storage bucket: `apolices-pdf` (public)
4. Enable Email Auth in Authentication > Providers

## 2. Environment Variables

Copy `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (for storage uploads)
GEMINI_API_KEY=                  # Google Gemini API key (PDF extraction, free tier — aistudio.google.com/apikey)
ANTHROPIC_API_KEY=               # (não usado atualmente; mantido para fallback caso queira voltar ao Claude)
EVOLUTION_API_URL=               # Evolution API base URL (WhatsApp)
EVOLUTION_API_KEY=               # Evolution API key
EVOLUTION_INSTANCE=              # Evolution instance name
```

## 3. First User Setup

After deploying and running the schema, create your first user:

1. Use Supabase Dashboard > Authentication > Users > Add User
2. Then run in SQL Editor:
```sql
INSERT INTO corretoras (nome) VALUES ('Nome da Sua Corretora') RETURNING id;
-- Copy the returned id, then:
INSERT INTO usuarios (id, corretora_id, email, nome)
VALUES ('<auth-user-id>', '<corretora-id>', 'seu@email.com', 'Seu Nome');
```

## 4. Development

```bash
# Always run from uppercase C:\ on Windows to avoid path case issues
cd C:\DEV2026\seguropro-app
npm run dev
```

## 5. Production Build

```bash
cd C:\DEV2026\seguropro-app  # uppercase C: required on Windows
npm run build
npm run start
```

## 6. EasyPanel Deploy

- Runtime: Node.js
- Build command: `npm run build`
- Start command: `npm run start`
- Port: 3000
- Environment variables: fill in all from step 2
