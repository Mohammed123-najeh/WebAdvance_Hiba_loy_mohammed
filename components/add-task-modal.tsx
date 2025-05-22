"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { graphqlRequest } from "@/lib/graphql/client"

interface AddTaskModalProps {
  onClose: () => void
  onTaskAdded: () => void
}

interface Project {
  id: number
  title: string
}

interface Student {
  id: number
  username: string
}

const GET_PROJECTS = `
  query GetProjects {
    projects {
      id
      title
    }
  }
`

const GET_STUDENTS = `
  query GetStudents {
    students {
      id
      username
    }
  }
`

const CREATE_TASK = `
  mutation CreateTask(
    $project_id: Int!
    $name: String!
    $description: String
    $student_id: Int
    $status: String!
    $due_date: String!
  ) {
    createTask(
      project_id: $project_id
      name: $name
      description: $description
      student_id: $student_id
      status: $status
      due_date: $due_date
    ) {
      id
      name
    }
  }
`

const GET_PROJECT_STUDENTS = `
  query GetProjectStudents($projectId: Int!) {
    project(id: $projectId) {
      students {
        id
        username
      }
    }
  }
`

export default function AddTaskModal({ onClose, onTaskAdded }: AddTaskModalProps) {
  const [projectId, setProjectId] = useState<number | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [studentId, setStudentId] = useState<number | null>(null)
  const [status, setStatus] = useState("")
  const [dueDate, setDueDate] = useState("")

  const [projectStudents, setProjectStudents] = useState<Student[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true)
        setError(null)

        // Use Promise.allSettled to handle partial failures
        const results = await Promise.allSettled([graphqlRequest(GET_PROJECTS), graphqlRequest(GET_STUDENTS)])

        // Handle projects result
        if (results[0].status === "fulfilled") {
          setProjects(results[0].value.projects)
        } else {
          console.error("Error fetching projects:", results[0].reason)
          setError("Failed to load projects. Some features may be limited.")
        }

        // Handle students result
        if (results[1].status === "fulfilled") {
          setStudents(results[1].value.students)
        } else {
          console.error("Error fetching students:", results[1].reason)
          setError((prev) =>
            prev ? `${prev} Failed to load students.` : "Failed to load students. Some features may be limited.",
          )
        }
      } catch (error) {
        console.error("Error fetching form data:", error)
        setError("Failed to load form data. Please try again.")
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectId || !name || !status || !dueDate) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      setError(null)

      await graphqlRequest(CREATE_TASK, {
        project_id: projectId,
        name,
        description,
        student_id: studentId,
        status,
        due_date: dueDate,
      })

      onTaskAdded()
    } catch (error: any) {
      console.error("Error creating task:", error)
      setError("Failed to create task. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2 overflow-y-auto">
      <div className="w-full max-w-2xl rounded bg-[#222] p-3 sm:p-4 my-4 sm:my-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-400">Create New Task</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white">
            ×
          </button>
        </div>

        {error && <div className="mb-4 rounded bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}

        {dataLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-xl text-gray-400">Loading form data...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-white">Project Title:</label>
              <select
                value={projectId || ""}
                onChange={async (e) => {
                  const newProjectId = Number(e.target.value)
                  setProjectId(newProjectId)

                  if (newProjectId) {
                    try {
                      const data = await graphqlRequest(GET_PROJECT_STUDENTS, { projectId: newProjectId })
                      if (data?.project?.students) {
                        setProjectStudents(data.project.students)
                      } else {
                        setProjectStudents([])
                      }
                    } catch (error) {
                      console.error("Error fetching project students:", error)
                      setProjectStudents([])
                    }
                  } else {
                    setProjectStudents([])
                  }
                }}
                className="w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white">Task Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white">Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-20 w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white">Assigned Student:</label>
              <select
                value={studentId || ""}
                onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a student</option>
                {projectId ? (
                  projectStudents.length > 0 ? (
                    projectStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.username}
                      </option>
                    ))
                  ) : (
                    <option disabled>No students assigned to this project</option>
                  )
                ) : (
                  <option disabled>Select a project first</option>
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a status</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white">Due Date:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-green-500 p-2 text-center font-medium text-white hover:bg-green-600 focus:outline-none disabled:opacity-70"
              >
                {loading ? "Adding Task..." : "Add Task"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
