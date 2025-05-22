import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

// Cache utility functions
export function getFromCache<T>(key: string, expiryMs = 5 * 60 * 1000): T | null {
  if (typeof window === "undefined") return null

  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const { data, timestamp } = JSON.parse(item)
    if (Date.now() - timestamp > expiryMs) {
      localStorage.removeItem(key)
      return null
    }

    return data
  } catch (e) {
    console.error(`Error retrieving ${key} from cache:`, e)
    return null
  }
}

export function setInCache<T>(key: string, data: T, metadata: Record<string, any> = {}) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
        ...metadata,
      }),
    )
  } catch (e) {
    console.error(`Error setting ${key} in cache:`, e)
  }
}
