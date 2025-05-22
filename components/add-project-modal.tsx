"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { graphqlRequest } from "@/lib/graphql/client"

interface AddProjectModalProps {
  onClose: () => void
  onProjectAdded: () => void
}

interface Category {
  id: number
  name: string
}

interface Student {
  id: number
  username: string
}

const GET_CATEGORIES = `
  query GetCategories {
    categories {
      id
      name
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

const CREATE_PROJECT = `
  mutation CreateProject(
    $title: String!
    $description: String
    $category_id: Int!
    $start_date: String!
    $end_date: String!
    $status: String!
    $student_ids: [Int!]!
  ) {
    createProject(
      title: $title
      description: $description
      category_id: $category_id
      start_date: $start_date
      end_date: $end_date
      status: $status
      student_ids: $student_ids
    ) {
      id
      title
    }
  }
`

export default function AddProjectModal({ onClose, onProjectAdded }: AddProjectModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState("In Progress")
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])

  const [categories, setCategories] = useState<Category[]>([])
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
        const results = await Promise.allSettled([graphqlRequest(GET_CATEGORIES), graphqlRequest(GET_STUDENTS)])

        // Handle categories result
        if (results[0].status === "fulfilled") {
          setCategories(results[0].value.categories)
        } else {
          console.error("Error fetching categories:", results[0].reason)
          setError("Failed to load categories. Some features may be limited.")
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

    if (!title || !categoryId || !startDate || !endDate || !status) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      setError(null)

      await graphqlRequest(CREATE_PROJECT, {
        title,
        description,
        category_id: categoryId,
        start_date: startDate,
        end_date: endDate,
        status,
        student_ids: selectedStudentIds,
      })

      onProjectAdded()
    } catch (error: any) {
      console.error("Error creating project:", error)
      setError("Failed to create project. Please try again.")
      setLoading(false)
    }
  }

  const toggleStudent = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2 overflow-y-auto">
      <div className="w-full max-w-2xl rounded bg-[#222] p-3 sm:p-4 my-4 sm:my-0">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-bold text-blue-400">Add New Project</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-white">
            ×
          </button>
        </div>

        {error && <div className="mb-2 rounded bg-red-500/10 p-2 text-sm text-red-500">{error}</div>}

        {dataLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="text-xl text-gray-400">Loading form data...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-white">Project Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white">Project Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-12 w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white">Project Category:</label>
              <select
                value={categoryId || ""}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white">Project Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white">Starting Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value
                  setStartDate(newStartDate)

                  // If end date exists and is now before start date, clear it
                  if (endDate && endDate < newStartDate) {
                    setEndDate("")
                    setError("Please select a new end date after the start date")
                  } else {
                    // Clear any existing date-related errors
                    if (error && error.includes("date")) {
                      setError(null)
                    }
                  }
                }}
                className="w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white">Ending Date:</label>
              <input
                type="date"
                value={endDate}
                min={startDate} // Add this line to prevent selecting dates before start date
                onChange={(e) => {
                  // Only update if the selected end date is after or equal to the start date
                  const newEndDate = e.target.value
                  if (!startDate || newEndDate >= startDate) {
                    setEndDate(newEndDate)
                  } else {
                    // If invalid date selected, show error
                    setError("End date cannot be before start date")
                  }
                }}
                className="w-full rounded bg-[#333] p-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="mb-2">
              <label className="mb-1 block text-sm text-white">Students List:</label>
              <div className="max-h-20 overflow-y-auto rounded bg-[#333] p-2">
                <div className="grid grid-cols-2 gap-1">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="mr-1 h-3 w-3"
                      />
                      <label htmlFor={`student-${student.id}`} className="text-sm text-white">
                        {student.username}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-green-500 p-2 text-center font-medium text-white hover:bg-green-600 focus:outline-none disabled:opacity-70"
              >
                {loading ? "Adding Project..." : "Add Project"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
