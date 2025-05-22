"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "@/app/actions/auth"
import type { User } from "@/lib/auth"
import { graphqlRequest } from "@/lib/graphql/client"
import AddTaskModal from "./add-task-modal"
import { formatDate } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import ThemeToggleButton from "./theme-toggle-button"

interface TasksPageProps {
  user: User
}

interface Project {
  id: number
  title: string
}

interface Student {
  id: number
  username: string
}

interface Task {
  id: number
  project: Project
  name: string
  description: string
  student: Student | null
  status: string
  due_date: string
}

const GET_TASKS = `
  query GetTasks($status: String) {
    tasks(status: $status) {
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

// Cache key for tasks
const TASKS_CACHE_KEY = "admin-tasks-cache"
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes in milliseconds

export default function TasksPage({ user }: TasksPageProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState("Task Status")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const fetchTasks = async (showLoading = true, useCache = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }

      setError(null)

      // Try to get data from cache first if useCache is true
      if (useCache && typeof window !== "undefined") {
        const cachedData = localStorage.getItem(TASKS_CACHE_KEY)
        if (cachedData) {
          try {
            const { data, timestamp, sort } = JSON.parse(cachedData)
            // Check if cache is still valid (less than 5 minutes old)
            if (Date.now() - timestamp < CACHE_EXPIRY) {
              setTasks(data)
              setLoading(false)
              // Fetch fresh data in the background
              fetchTasks(false, false)
              return
            }
          } catch (e) {
            console.error("Error parsing cached tasks:", e)
            // Continue with fetch if cache parsing fails
          }
        }
      }

      const data = await graphqlRequest(GET_TASKS, { status: null })
      setTasks(data.tasks)

      // Cache the fresh data
      if (typeof window !== "undefined") {
        localStorage.setItem(
          TASKS_CACHE_KEY,
          JSON.stringify({
            data: data.tasks,
            timestamp: Date.now(),
            sort: sortBy,
          }),
        )
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error)
      setError("Failed to load tasks. Please try again later.")
    } finally {
      if (showLoading) {
        setLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push("/signin")
  }

  const handleCreateTask = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleTaskAdded = () => {
    // Clear cache when a new task is added
    if (typeof window !== "undefined") {
      localStorage.removeItem(TASKS_CACHE_KEY)
    }
    fetchTasks()
    setIsModalOpen(false)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "Task Status":
        return a.status.localeCompare(b.status)
      case "Due Date":
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      case "Task ID":
        return a.id - b.id
      case "Project":
        return a.project.title.localeCompare(b.project.title)
      default:
        return 0
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-blue-400"
      case "In Progress":
        return "text-green-400"
      case "Pending":
        return "text-yellow-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-blue-400/10"
      case "In Progress":
        return "bg-green-400/10"
      case "Pending":
        return "bg-yellow-400/10"
      default:
        return "bg-gray-400/10"
    }
  }

  // Theme-based classes
  const bgMain = isDark ? "bg-[#1a1a1a]" : "bg-gray-100"
  const bgHeader = isDark ? "bg-[#222]" : "bg-white"
  const bgSidebar = isDark ? "bg-[#222]" : "bg-white"
  const bgCard = isDark ? "bg-[#222]" : "bg-white"
  const bgCardHover = isDark ? "hover:bg-[#2a2a2a]" : "hover:bg-gray-50"
  const borderColor = isDark ? "border-[#444]" : "border-gray-200"
  const textColor = isDark ? "text-white" : "text-gray-900"
  const textMuted = isDark ? "text-gray-400" : "text-gray-500"
  const bgInput = isDark ? "bg-[#333]" : "bg-gray-100"

  return (
    <div className={`flex h-screen flex-col ${bgMain} ${textColor} transition-colors duration-300`}>
      {/* Top Navigation Bar */}
      <header
        className={`flex h-14 items-center justify-between ${bgHeader} px-4 shadow-md transition-colors duration-300`}
      >
        <div className="md:hidden">
          <button onClick={toggleSidebar} className="rounded p-1 hover:bg-opacity-20 hover:bg-gray-500">
            <Menu size={24} />
          </button>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggleButton />
          <span className="text-xl font-semibold">Admin {user.username}</span>
          <button
            onClick={handleSignOut}
            className="rounded bg-red-500 px-4 py-1 font-medium text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden" onClick={toggleSidebar}></div>
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 transform ${bgSidebar} p-2 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } shadow-md`}
        >
          <div className="flex justify-end p-2 md:hidden">
            <button onClick={toggleSidebar} className="rounded p-1 hover:bg-opacity-20 hover:bg-gray-500">
              <X size={24} />
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => {
                router.push("/dashboard")
                setIsSidebarOpen(false)
              }}
              className={`flex h-12 items-center rounded ${bgInput} px-4 text-left text-lg font-medium ${textColor} hover:bg-opacity-80`}
            >
              Home
            </button>
            <button
              onClick={() => {
                router.push("/projects")
                setIsSidebarOpen(false)
              }}
              className={`flex h-12 items-center rounded ${bgInput} px-4 text-left text-lg font-medium ${textColor} hover:bg-opacity-80`}
            >
              Projects
            </button>
            <button
              onClick={() => {
                router.push("/tasks")
                setIsSidebarOpen(false)
              }}
              className="flex h-12 items-center rounded bg-blue-500 px-4 text-left text-lg font-medium text-white hover:bg-blue-600"
            >
              Tasks
            </button>
            <button
              onClick={() => {
                router.push("/chat")
                setIsSidebarOpen(false)
              }}
              className={`flex h-12 items-center rounded ${bgInput} px-4 text-left text-lg font-medium ${textColor} hover:bg-opacity-80`}
            >
              Chat
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 overflow-auto ${isDark ? "bg-[#1e1e1e]" : "bg-gray-50"} p-3 sm:p-6 transition-colors duration-300`}
        >
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <span className="text-base sm:text-lg font-medium">Sort By:</span>
              <select
                className={`w-full sm:w-auto rounded ${bgInput} px-3 py-2 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option>Task Status</option>
                <option>Due Date</option>
                <option>Task ID</option>
                <option>Project</option>
              </select>
            </div>
            <button
              onClick={handleCreateTask}
              className="w-full sm:w-auto rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
            >
              Create a New Task
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded bg-red-500/10 p-4 text-red-500">
              <p>{error}</p>
              <button
                onClick={() => fetchTasks()}
                className="mt-2 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <div className="text-xl text-gray-400">Loading tasks...</div>
              </div>
            </div>
          ) : tasks.length === 0 && !error ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-xl text-gray-400">No tasks found</div>
            </div>
          ) : (
            !error && (
              <>
                {isRefreshing && (
                  <div className="mb-4 flex items-center justify-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-xs text-gray-400">Refreshing...</span>
                  </div>
                )}

                {/* Mobile Task Cards */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {sortedTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`rounded border ${borderColor} ${bgCard} p-4 transition-colors duration-300`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={textMuted}>Task #{task.id}</span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${getStatusBgColor(task.status)} ${getStatusColor(task.status)}`}
                        >
                          {task.status}
                        </span>
                      </div>
                      <h3 className="mb-1 text-lg font-semibold">{task.name}</h3>
                      <p className="mb-3 text-sm text-gray-300">{task.description}</p>

                      <div className="mb-2 flex flex-col">
                        <span className={textMuted}>Project:</span>
                        <span className="text-sm">{task.project.title}</span>
                      </div>

                      <div className="mb-2 flex flex-col">
                        <span className={textMuted}>Assigned to:</span>
                        <span className="text-sm">{task.student?.username || "Unassigned"}</span>
                      </div>

                      <div className="flex flex-col">
                        <span className={textMuted}>Due Date:</span>
                        <span className="text-sm">{formatDate(task.due_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto -mx-3 sm:mx-0">
                  <div className={`min-w-[800px] rounded border ${borderColor}`}>
                    <table className="w-full">
                      <thead className={bgCard}>
                        <tr>
                          <th className={`border-b ${borderColor} p-2 sm:p-3 text-left text-xs sm:text-sm`}>Task ID</th>
                          <th className={`border-b ${borderColor} p-2 sm:p-3 text-left text-xs sm:text-sm`}>Project</th>
                          <th className={`border-b ${borderColor} p-2 sm:p-3 text-left text-xs sm:text-sm`}>
                            Task Name
                          </th>
                          <th className={`border-b ${borderColor} p-2 sm:p-3 text-left text-xs sm:text-sm`}>
                            Description
                          </th>
                          <th className={`border-b ${borderColor} p-2 sm:p-3 text-left text-xs sm:text-sm`}>
                            Assigned Student
                          </th>
                          <th className={`border-b ${borderColor} p-2 sm:p-3 text-left text-xs sm:text-sm`}>Status</th>
                          <th className={`border-b ${borderColor} p-2 sm:p-3 text-left text-xs sm:text-sm`}>
                            Due Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTasks.map((task) => (
                          <tr key={task.id} className={bgCardHover}>
                            <td className={`border-b ${borderColor} p-2 sm:p-3 text-xs sm:text-sm`}>{task.id}</td>
                            <td className={`border-b ${borderColor} p-2 sm:p-3 text-xs sm:text-sm`}>
                              {task.project.title}
                            </td>
                            <td className={`border-b ${borderColor} p-2 sm:p-3 text-xs sm:text-sm`}>{task.name}</td>
                            <td className={`border-b ${borderColor} p-2 sm:p-3 text-xs sm:text-sm`}>
                              {task.description}
                            </td>
                            <td className={`border-b ${borderColor} p-2 sm:p-3 text-xs sm:text-sm`}>
                              {task.student?.username || "Unassigned"}
                            </td>
                            <td
                              className={`border-b ${borderColor} p-2 sm:p-3 text-xs sm:text-sm ${getStatusColor(task.status)}`}
                            >
                              {task.status}
                            </td>
                            <td className={`border-b ${borderColor} p-2 sm:p-3 text-xs sm:text-sm`}>
                              {formatDate(task.due_date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )
          )}
        </main>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && <AddTaskModal onClose={handleCloseModal} onTaskAdded={handleTaskAdded} />}
    </div>
  )
}
