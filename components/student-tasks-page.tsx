"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { graphqlRequest } from "@/lib/graphql/client"
import { formatDate } from "@/lib/utils"
import type { User } from "@/lib/auth"
import DashboardLayout from "./dashboard-layout"

interface StudentTasksPageProps {
  user: User
}

interface Project {
  id: number
  title: string
}

interface Task {
  id: number
  project: Project
  name: string
  description: string
  status: string
  due_date: string
  student: {
    id: number
    username: string
  }
}

// Cache utility functions
const CACHE_KEY = "student-tasks-cache"
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes in milliseconds

function getCache() {
  if (typeof window === "undefined") return null

  try {
    const cache = localStorage.getItem(CACHE_KEY)
    if (!cache) return null

    const { data, timestamp } = JSON.parse(cache)
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return data
  } catch (error) {
    console.error("Error reading from cache:", error)
    return null
  }
}

function setCache(data: Task[]) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    )
  } catch (error) {
    console.error("Error writing to cache:", error)
  }
}

const GET_STUDENT_TASKS = `
  query GetTasks {
    tasks {
      id
      name
      description
      status
      due_date
      project {
        id
        title
      }
      student {
        id
        username
      }
    }
  }
`

export default function StudentTasksPage({ user }: StudentTasksPageProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [sortBy, setSortBy] = useState("Due Date")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Format date: Saturday, February 22, 2025 at 05:15:07 PM
  const formattedDate = currentTime.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  const fetchTasks = async () => {
    try {
      setLoading(true)

      // Try to get data from cache first
      const cachedData = getCache()
      if (cachedData) {
        setTasks(cachedData)
        setLoading(false)

        // Refresh in background
        refreshTasksInBackground()
        return
      }

      // If no cache, fetch from API
      setError(null)
      const data = await graphqlRequest(GET_STUDENT_TASKS)
      // Filter tasks assigned to the current student
      const studentTasks = data.tasks.filter((task) => task.student && task.student.id === user.id)
      setTasks(studentTasks || [])

      // Save to cache
      setCache(studentTasks || [])
    } catch (error: any) {
      console.error("Error fetching tasks:", error)
      setError("Failed to load tasks. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Add a function to refresh data in the background
  const refreshTasksInBackground = async () => {
    try {
      const data = await graphqlRequest(GET_STUDENT_TASKS)
      const studentTasks = data.tasks.filter((task) => task.student && task.student.id === user.id)
      setTasks(studentTasks || [])
      setCache(studentTasks || [])
    } catch (error) {
      console.error("Error refreshing tasks in background:", error)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [user.id])

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "Task Status":
        return a.status.localeCompare(b.status)
      case "Due Date":
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      case "Project":
        return a.project.title.localeCompare(b.project.title)
      default:
        return 0
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-500"
      case "In Progress":
        return "text-blue-500"
      case "Pending":
        return "text-yellow-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <DashboardLayout user={user} activePage="tasks">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <h1 className="text-xl sm:text-3xl font-bold text-blue-400">My Tasks</h1>
        <div className="text-sm sm:text-base text-foreground">{formattedDate}</div>
      </div>

      <div className="mb-4 sm:mb-6 flex items-center justify-end gap-2 sm:gap-4">
        <span className="text-base sm:text-lg font-medium">Sort By:</span>
        <select
          className="rounded bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option>Due Date</option>
          <option>Task Status</option>
          <option>Project</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded bg-red-500/10 p-4 text-red-500">
          <p>{error}</p>
          <button
            onClick={fetchTasks}
            className="mt-2 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Tasks Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            <div className="text-xl text-text-muted">Loading tasks...</div>
          </div>
        </div>
      ) : tasks.length === 0 && !error ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-xl text-text-muted">No tasks found</div>
        </div>
      ) : (
        !error && (
          <div className="overflow-x-auto -mx-3 sm:mx-0 rounded border border-border-color">
            <table className="w-full">
              <thead className="bg-card-background">
                <tr>
                  <th className="border-b border-border-color p-2 sm:p-3 text-left text-xs sm:text-sm">Task ID</th>
                  <th className="border-b border-border-color p-2 sm:p-3 text-left text-xs sm:text-sm">Project</th>
                  <th className="border-b border-border-color p-2 sm:p-3 text-left text-xs sm:text-sm">Task Name</th>
                  <th className="border-b border-border-color p-2 sm:p-3 text-left text-xs sm:text-sm">Description</th>
                  <th className="border-b border-border-color p-2 sm:p-3 text-left text-xs sm:text-sm">Status</th>
                  <th className="border-b border-border-color p-2 sm:p-3 text-left text-xs sm:text-sm">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-input-background">
                    <td className="border-b border-border-color p-2 sm:p-3 text-xs sm:text-sm">{task.id}</td>
                    <td className="border-b border-border-color p-2 sm:p-3 text-xs sm:text-sm">{task.project.title}</td>
                    <td className="border-b border-border-color p-2 sm:p-3 text-xs sm:text-sm">{task.name}</td>
                    <td className="border-b border-border-color p-2 sm:p-3 text-xs sm:text-sm">{task.description}</td>
                    <td
                      className={`border-b border-border-color p-2 sm:p-3 text-xs sm:text-sm ${getStatusColor(task.status)}`}
                    >
                      {task.status}
                    </td>
                    <td className="border-b border-border-color p-2 sm:p-3 text-xs sm:text-sm">
                      {formatDate(task.due_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </DashboardLayout>
  )
}
