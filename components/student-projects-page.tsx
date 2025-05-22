"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { graphqlRequest } from "@/lib/graphql/client"
import { formatDate } from "@/lib/utils"
import type { User } from "@/lib/auth"
import DashboardLayout from "./dashboard-layout"

interface StudentProjectsPageProps {
  user: User
}

interface Category {
  id: number
  name: string
}

interface Student {
  id: number
  username: string
}

interface Project {
  id: number
  title: string
  description: string
  category: Category
  start_date: string
  end_date: string
  status: string
  progress: number
  students: Student[]
}

// Cache utility functions
const CACHE_KEY = "student-projects-cache"
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

function setCache(data: Project[]) {
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

const GET_STUDENT_PROJECTS = `
  query GetProjects {
    projects {
      id
      title
      description
      category {
        id
        name
      }
      start_date
      end_date
      status
      progress
      students {
        id
        username
      }
    }
  }
`

export default function StudentProjectsPage({ user }: StudentProjectsPageProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
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

  const fetchProjects = async () => {
    try {
      setLoading(true)

      // Try to get data from cache first
      const cachedData = getCache()
      if (cachedData) {
        setProjects(cachedData)
        setLoading(false)

        // Refresh in background
        refreshProjectsInBackground()
        return
      }

      // If no cache, fetch from API
      setError(null)
      const data = await graphqlRequest(GET_STUDENT_PROJECTS)
      // Filter projects that include the current student
      const studentProjects = data.projects.filter((project) =>
        project.students.some((student) => student.id === user.id),
      )
      setProjects(studentProjects || [])

      // Save to cache
      setCache(studentProjects || [])
    } catch (error: any) {
      console.error("Error fetching projects:", error)
      setError("Failed to load projects. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Add a function to refresh data in the background
  const refreshProjectsInBackground = async () => {
    try {
      const data = await graphqlRequest(GET_STUDENT_PROJECTS)
      const studentProjects = data.projects.filter((project) =>
        project.students.some((student) => student.id === user.id),
      )
      setProjects(studentProjects || [])
      setCache(studentProjects || [])
    } catch (error) {
      console.error("Error refreshing projects in background:", error)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user.id])

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500"
      case "In Progress":
        return "bg-blue-500"
      case "On Hold":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <DashboardLayout user={user} activePage="projects">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <h1 className="text-xl sm:text-3xl font-bold text-blue-400">Projects Overview</h1>
        <div className="text-sm sm:text-base text-foreground">{formattedDate}</div>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Search projects..."
          className="w-full rounded bg-input-background px-3 py-2 text-foreground placeholder-gray-400 border border-border-color focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded bg-red-500/10 p-4 text-red-500">
          <p>{error}</p>
          <button
            onClick={fetchProjects}
            className="mt-2 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            <div className="text-xl text-text-muted">Loading projects...</div>
          </div>
        </div>
      ) : filteredProjects.length === 0 && !error ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-xl text-text-muted">No projects found</div>
        </div>
      ) : (
        !error && (
          <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="rounded border border-border-color bg-card-background p-3 sm:p-4 hover:border-blue-500"
              >
                <h2 className="mb-2 text-lg sm:text-xl font-bold text-blue-400">{project.title}</h2>

                <div className="mb-3 sm:mb-4">
                  <p className="mb-1 text-xs sm:text-sm text-text-muted">Description:</p>
                  <p className="text-sm sm:text-base text-foreground">{project.description}</p>
                </div>

                <div className="mb-3 sm:mb-4">
                  <p className="mb-1 text-xs sm:text-sm text-text-muted">Team Members:</p>
                  <p className="text-sm sm:text-base text-foreground">
                    {project.students.map((student) => student.username).join(", ")}
                  </p>
                </div>

                <div className="mb-3 sm:mb-4">
                  <p className="mb-1 text-xs sm:text-sm text-text-muted">Category:</p>
                  <p className="text-sm sm:text-base text-foreground">{project.category?.name}</p>
                </div>

                <div className="mb-2 h-3 sm:h-4 overflow-hidden rounded-full bg-input-background">
                  <div
                    className={`h-full ${getProgressBarColor(project.status)}`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs sm:text-sm text-text-muted">
                  <span>{formatDate(project.start_date)}</span>
                  <span>{formatDate(project.end_date)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </DashboardLayout>
  )
}
