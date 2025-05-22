"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "@/app/actions/auth"
import type { User } from "@/lib/auth"
import { graphqlRequest } from "@/lib/graphql/client"
import AddProjectModal from "./add-project-modal"
import { formatDate } from "@/lib/utils"
import ProjectDetailsPanel from "./project-details-panel"
import { X, Menu } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import ThemeToggleButton from "./theme-toggle-button"

interface ProjectsPageProps {
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

interface Task {
  id: number
  name: string
  description: string
  status: string
  due_date: string
  student: {
    id: number
    username: string
  } | null
}

const GET_PROJECTS = `
  query GetProjects($status: String) {
    projects(status: $status) {
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

const GET_PROJECT_TASKS = `
  query GetProjectTasks($projectId: Int!) {
    tasks(projectId: $projectId) {
      id
      name
      description
      status
      due_date
      student {
        id
        username
      }
    }
  }
`

// Cache key for projects
const PROJECTS_CACHE_KEY = "admin-projects-cache"
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes in milliseconds

export default function ProjectsPage({ user }: ProjectsPageProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectTasks, setProjectTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  const fetchProjects = async (showLoading = true, useCache = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }

      setError(null)

      // Try to get data from cache first if useCache is true
      if (useCache && typeof window !== "undefined") {
        const cachedData = localStorage.getItem(PROJECTS_CACHE_KEY)
        if (cachedData) {
          try {
            const { data, timestamp, filter } = JSON.parse(cachedData)
            // Check if cache is still valid (less than 5 minutes old) and filter matches
            if (Date.now() - timestamp < CACHE_EXPIRY && filter === statusFilter) {
              setProjects(data)
              setLoading(false)
              // Fetch fresh data in the background
              fetchProjects(false, false)
              return
            }
          } catch (e) {
            console.error("Error parsing cached projects:", e)
            // Continue with fetch if cache parsing fails
          }
        }
      }

      const data = await graphqlRequest(GET_PROJECTS, { status: statusFilter === "All Statuses" ? null : statusFilter })
      setProjects(data.projects)

      // Cache the fresh data
      if (typeof window !== "undefined") {
        localStorage.setItem(
          PROJECTS_CACHE_KEY,
          JSON.stringify({
            data: data.projects,
            timestamp: Date.now(),
            filter: statusFilter,
          }),
        )
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error)
      setError("Failed to load projects. Please try again later.")
    } finally {
      if (showLoading) {
        setLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  const fetchProjectTasks = async (projectId: number) => {
    try {
      setTasksLoading(true)
      const data = await graphqlRequest(GET_PROJECT_TASKS, { projectId })
      setProjectTasks(data.tasks)
    } catch (error: any) {
      console.error("Error fetching project tasks:", error)
      // We don't set the main error state here to avoid disrupting the main UI
    } finally {
      setTasksLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [statusFilter])

  useEffect(() => {
    if (selectedProject) {
      fetchProjectTasks(selectedProject.id)
    }
  }, [selectedProject])

  const handleSignOut = async () => {
    await signOut()
    router.push("/signin")
  }

  const handleAddProject = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleProjectAdded = () => {
    // Clear cache when a new project is added
    if (typeof window !== "undefined") {
      localStorage.removeItem(PROJECTS_CACHE_KEY)
    }
    fetchProjects()
    setIsModalOpen(false)
  }

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project)
  }

  const handleCloseDetails = () => {
    setSelectedProject(null)
    setProjectTasks([])
  }

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
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-opacity-20 hover:bg-gray-500"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>
        <div className="flex items-center gap-4 ml-auto">
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
        {/* Sidebar - Mobile */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden" onClick={() => setSidebarOpen(false)}>
            <div
              className={`h-full w-64 ${bgSidebar} p-2 transform transition-transform duration-300`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between p-2">
                <span className="text-xl font-semibold">Menu</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500`}
                >
                  <X size={24} />
                </button>
              </div>
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSidebarOpen(false)
                    router.push("/dashboard")
                  }}
                  className={`flex h-12 items-center rounded bg-[#333] px-4 text-left text-lg font-medium ${textColor} hover:bg-[#444]`}
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setSidebarOpen(false)
                    router.push("/projects")
                  }}
                  className="flex h-12 items-center rounded bg-blue-500 px-4 text-left text-lg font-medium text-white hover:bg-blue-600"
                >
                  Projects
                </button>
                <button
                  onClick={() => {
                    setSidebarOpen(false)
                    router.push("/tasks")
                  }}
                  className={`flex h-12 items-center rounded bg-[#333] px-4 text-left text-lg font-medium ${textColor} hover:bg-[#444]`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => {
                    setSidebarOpen(false)
                    router.push("/chat")
                  }}
                  className={`flex h-12 items-center rounded bg-[#333] px-4 text-left text-lg font-medium ${textColor} hover:bg-[#444]`}
                >
                  Chat
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Sidebar - Desktop */}
        <aside className={`hidden w-64 ${bgSidebar} p-2 md:block shadow-md transition-colors duration-300`}>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className={`flex h-12 items-center rounded bg-[#333] px-4 text-left text-lg font-medium ${textColor} hover:bg-[#444]`}
            >
              Home
            </button>
            <button
              onClick={() => router.push("/projects")}
              className="flex h-12 items-center rounded bg-blue-500 px-4 text-left text-lg font-medium text-white hover:bg-blue-600"
            >
              Projects
            </button>
            <button
              onClick={() => router.push("/tasks")}
              className={`flex h-12 items-center rounded bg-[#333] px-4 text-left text-lg font-medium ${textColor} hover:bg-[#444]`}
            >
              Tasks
            </button>
            <button
              onClick={() => router.push("/chat")}
              className={`flex h-12 items-center rounded bg-[#333] px-4 text-left text-lg font-medium ${textColor} hover:bg-[#444]`}
            >
              Chat
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 overflow-auto p-3 sm:p-6 ${selectedProject ? "md:flex" : ""} transition-colors duration-300`}
        >
          <div
            className={`${selectedProject ? "md:w-1/2 md:pr-4" : "w-full"} ${selectedProject && !selectedProject ? "hidden md:block" : ""}`}
          >
            <h1 className="mb-4 text-2xl sm:text-3xl font-bold text-blue-400">Projects Overview</h1>

            {/* Controls */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <button
                onClick={handleAddProject}
                className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 order-1 sm:order-none"
              >
                Add New Project
              </button>

              <input
                type="text"
                placeholder="Search projects..."
                className={`flex-1 rounded ${bgInput} px-3 py-2 ${textColor} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 order-3 sm:order-none`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <select
                className={`rounded ${bgInput} px-3 py-2 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500 order-2 sm:order-none`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All Statuses</option>
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>On Hold</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded bg-red-500/10 p-4 text-red-500">
                <p>{error}</p>
                <button
                  onClick={() => fetchProjects()}
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
                  <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  <div className="text-xl text-gray-400">Loading projects...</div>
                </div>
              </div>
            ) : filteredProjects.length === 0 && !error ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-xl text-gray-400">No projects found</div>
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
                  <div
                    className={`grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 ${isDark ? "bg-[#1e1e1e]" : "bg-gray-50"} p-4 rounded-lg transition-colors duration-300`}
                  >
                    {filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        className={`rounded border ${
                          selectedProject?.id === project.id ? "border-blue-500" : borderColor
                        } ${bgCard} p-3 sm:p-4 hover:border-blue-500 cursor-pointer transition-all ${bgCardHover}`}
                        onClick={() => handleProjectClick(project)}
                      >
                        <h2 className="mb-2 text-lg sm:text-xl font-bold text-blue-400">{project.title}</h2>

                        <div className="mb-3 sm:mb-4">
                          <p className={`mb-1 text-xs sm:text-sm ${textMuted}`}>Description:</p>
                          <p className="text-sm sm:text-base">{project.description}</p>
                        </div>

                        <div className="mb-3 sm:mb-4">
                          <p className={`mb-1 text-xs sm:text-sm ${textMuted}`}>Students:</p>
                          <p className="text-sm sm:text-base">
                            {project.students.map((student) => student.username).join(", ")}
                          </p>
                        </div>

                        <div className="mb-3 sm:mb-4">
                          <p className={`mb-1 text-xs sm:text-sm ${textMuted}`}>Category:</p>
                          <p className="text-sm sm:text-base">{project.category?.name}</p>
                        </div>

                        <div className={`mb-2 h-3 sm:h-4 overflow-hidden rounded-full ${bgInput}`}>
                          <div
                            className={`h-full ${getProgressBarColor(project.status)}`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>

                        <div className={`flex justify-between text-xs sm:text-sm ${textMuted}`}>
                          <span>{formatDate(project.start_date)}</span>
                          <span>{formatDate(project.end_date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}
          </div>

          {/* Project Details Panel - Desktop */}
          {selectedProject && (
            <div className={`hidden md:block md:w-1/2 md:pl-4 md:border-l ${borderColor}`}>
              <ProjectDetailsPanel
                project={selectedProject}
                tasks={projectTasks}
                loading={tasksLoading}
                onClose={handleCloseDetails}
              />
            </div>
          )}

          {/* Project Details Panel - Mobile (Full Screen Overlay) */}
          {selectedProject && (
            <div className={`fixed inset-0 z-50 ${bgMain} overflow-auto p-4 md:hidden`}>
              <button
                onClick={handleCloseDetails}
                className={`absolute top-4 right-4 ${textMuted} hover:${textColor} p-2 ${bgInput} rounded-full`}
              >
                <X size={24} />
              </button>
              <div className="pt-10">
                <ProjectDetailsPanel
                  project={selectedProject}
                  tasks={projectTasks}
                  loading={tasksLoading}
                  onClose={handleCloseDetails}
                  isMobile={true}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Project Modal */}
      {isModalOpen && <AddProjectModal onClose={handleCloseModal} onProjectAdded={handleProjectAdded} />}
    </div>
  )
}
