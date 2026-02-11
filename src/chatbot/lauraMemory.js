// Memoria de sesión simple para LAURA (usa sessionStorage)
const PREFIX = 'laura_memory_v1_'

export function createSession(sessionId) {
  const sid = sessionId || `s_${Date.now()}`
  const key = PREFIX + sid
  if (!sessionStorage.getItem(key)) {
    const initial = { createdAt: new Date().toISOString(), data: {} }
    sessionStorage.setItem(key, JSON.stringify(initial))
  }
  return sid
}

export function getMemory(sessionId) {
  if (!sessionId) return null
  const raw = sessionStorage.getItem(PREFIX + sessionId)
  return raw ? JSON.parse(raw).data : {}
}

export function remember(sessionId, key, value) {
  if (!sessionId) return false
  const storageKey = PREFIX + sessionId
  const raw = sessionStorage.getItem(storageKey)
  const obj = raw ? JSON.parse(raw) : { createdAt: new Date().toISOString(), data: {} }
  obj.data = obj.data || {}
  obj.data[key] = value
  sessionStorage.setItem(storageKey, JSON.stringify(obj))
  return true
}

export function recall(sessionId, key) {
  const mem = getMemory(sessionId) || {}
  return mem[key]
}

export function clearSession(sessionId) {
  if (!sessionId) return false
  sessionStorage.removeItem(PREFIX + sessionId)
  return true
}

export default { createSession, getMemory, remember, recall, clearSession }
