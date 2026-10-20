const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.base_url ??
  ''
).replace(/\/+$/, '')
const SESSION_STORAGE_KEY = 'traveladmin.session'
const REMEMBERED_EMAIL_KEY = 'traveladmin.rememberedEmail'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function requestLogin(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.message ?? 'Invalid email or password.')
  }
  return { token: data.access_token ?? data.token, user: data.user ?? null }
}

async function mockLogin({ email, password }) {
  await sleep(900)
  if (email.toLowerCase() !== 'admin@traveladmin.com' || password !== 'admin123') {
    throw new Error('Invalid email or password.')
  }
  return {
    token: 'mock-session-token',
    user: { email: 'admin@traveladmin.com', name: 'Administrator', role: 'admin' },
  }
}

export function persistSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export async function login(credentials) {
  const session = API_BASE_URL ? await requestLogin(credentials) : await mockLogin(credentials)
  persistSession(session)
  return session
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function getRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

export function rememberEmail(email) {
  localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
}

export function forgetRememberedEmail() {
  localStorage.removeItem(REMEMBERED_EMAIL_KEY)
}
