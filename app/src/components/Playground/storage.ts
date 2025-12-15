import type { Format } from "./types"

const DB_NAME = "1ls-playground"
const DB_VERSION = 1
const STORE_NAME = "state"
const STATE_KEY = "playground-state"

export interface StoredState {
  format: Format
  input: string
  expression: string
  savedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function saveState(state: Omit<StoredState, "savedAt">): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const storedState: StoredState = { ...state, savedAt: Date.now() }
    store.put(storedState, STATE_KEY)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // Silently fail - storage is optional
  }
}

export async function loadState(): Promise<StoredState | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(STATE_KEY)
    const result = await new Promise<StoredState | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
    db.close()
    return result
  } catch {
    return null
  }
}

export function encodeShareableState(state: Omit<StoredState, "savedAt">): string {
  const json = JSON.stringify({ f: state.format, i: state.input, e: state.expression })
  return btoa(encodeURIComponent(json))
}

export function decodeShareableState(encoded: string): Omit<StoredState, "savedAt"> | null {
  try {
    const json = decodeURIComponent(atob(encoded))
    const parsed = JSON.parse(json)
    if (parsed.f && typeof parsed.i === "string" && typeof parsed.e === "string") {
      return { format: parsed.f, input: parsed.i, expression: parsed.e }
    }
    return null
  } catch {
    return null
  }
}

export function getShareableUrl(state: Omit<StoredState, "savedAt">): string {
  const encoded = encodeShareableState(state)
  const url = new URL(window.location.href)
  url.searchParams.set("s", encoded)
  return url.toString()
}

export function getStateFromUrl(): Omit<StoredState, "savedAt"> | null {
  const url = new URL(window.location.href)
  const encoded = url.searchParams.get("s")
  if (!encoded) return null
  return decodeShareableState(encoded)
}
