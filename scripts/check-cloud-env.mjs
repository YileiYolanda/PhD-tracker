import { loadEnv } from 'vite'

const env = loadEnv('production', process.cwd(), 'VITE_')
const url = env.VITE_SUPABASE_URL?.trim()
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

function fail(message) {
  console.error(`Cloud build configuration error: ${message}`)
  process.exit(1)
}

if (!url || !key) fail('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the hosting project before deploying.')
try {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) fail('Use the HTTPS Supabase project URL.')
} catch { fail('VITE_SUPABASE_URL must be a valid HTTPS URL.') }

let publicKey = key.startsWith('sb_publishable_')
if (!publicKey) {
  try { publicKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon' }
  catch { /* Invalid or non-public key. Never print its value. */ }
}
if (!publicKey) fail('Use a publishable key or legacy anon key, never a secret or service_role key.')
console.log('Supabase public build configuration is present. No credentials were printed.')
