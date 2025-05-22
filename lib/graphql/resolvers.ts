import { createServerClient } from "@/lib/auth"

export const resolvers = {
  Query: {
    projects: async (_: any, { status }: { status?: string }) => {
      const supabase = createServerClient()

      let query = supabase.from("projects").select("*, category:category_id(id, name)")

      if (status && status !== "All Statuses") {
        query = query.eq("status", status)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching projects:", error)
        throw new Error("Failed to fetch projects")
      }

      return data
    },

    project: async (_: any, { id }: { id: number }) => {
      const supabase = createServerClient()

      const { data, error } = await supabase
        .from("projects")
        .select("*, category:category_id(id, name)")
        .eq("id", id)
        .single()

      if (error) {
        console.error("Error fetching project:", error)
        throw new Error("Failed to fetch project")
      }

      return data
    },

    categories: async () => {
      const supabase = createServerClient()

      const { data, error } = await supabase.from("project_categories").select("*")

      if (error) {
        console.error("Error fetching categories:", error)
        throw new Error("Failed to fetch categories")
      }

      return data
    },

    students: async () => {
      const supabase = createServerClient()

      const { data, error } = await supabase.from("custom_users").select("*").eq("role", "student")

      if (error) {
        console.error("Error fetching students:", error)
        throw new Error("Failed to fetch students")
      }

      return data
    },

    admins: async () => {
      const supabase = createServerClient()

      const { data, error } = await supabase.from("custom_users").select("*").eq("role", "admin")

      if (error) {
        console.error("Error fetching admins:", error)
        throw new Error("Failed to fetch admins")
      }

      return data
    },

    allUsers: async (_: any, __: any, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser) {
        throw new Error("Authentication required")
      }

      const { data, error } = await supabase.from("custom_users").select("*").neq("id", currentUser.id)

      if (error) {
        console.error("Error fetching users:", error)
        throw new Error("Failed to fetch users")
      }

      return data
    },

    tasks: async (_: any, { status, projectId }: { status?: string; projectId?: number }) => {
      const supabase = createServerClient()

      let query = supabase.from("tasks").select("*, project:project_id(*), student:student_id(*)")

      if (status && status !== "All Statuses") {
        query = query.eq("status", status)
      }

      if (projectId) {
        query = query.eq("project_id", projectId)
      }

      const { data, error } = await query.order("id")

      if (error) {
        console.error("Error fetching tasks:", error)
        throw new Error("Failed to fetch tasks")
      }

      return data
    },

    task: async (_: any, { id }: { id: number }) => {
      const supabase = createServerClient()

      const { data, error } = await supabase
        .from("tasks")
        .select("*, project:project_id(*), student:student_id(*)")
        .eq("id", id)
        .single()

      if (error) {
        console.error("Error fetching task:", error)
        throw new Error("Failed to fetch task")
      }

      return data
    },

    conversations: async (_: any, __: any, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser) {
        throw new Error("Authentication required")
      }

      try {
        // Use the fixed database function
        const { data, error } = await supabase.rpc("get_user_conversations", {
          user_id: currentUser.id,
        })

        if (error) {
          console.error("Error fetching conversations:", error)
          throw new Error("Failed to fetch conversations: " + error.message)
        }

        if (!data || !Array.isArray(data)) {
          console.error("Invalid data returned from get_user_conversations:", data)
          return []
        }

        // Transform the data to match the Conversation type
        return data.map((conv: any) => ({
          id: conv.conversation_id,
          other_user: {
            id: conv.other_user_id,
            username: conv.other_username,
            role: conv.other_user_role,
            last_seen: conv.other_user_last_seen || conv.last_message_time || new Date().toISOString(),
          },
          last_message: conv.last_message || "",
          last_message_time: conv.last_message_time || new Date().toISOString(),
          unread_count: conv.unread_count || 0,
        }))
      } catch (error: any) {
        console.error("Error in conversations resolver:", error)
        throw new Error("Failed to fetch conversations: " + error.message)
      }
    },

    messages: async (_: any, { conversationId }: { conversationId: number }, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser) {
        throw new Error("Authentication required")
      }

      try {
        // Verify the user is part of this conversation
        const { data: participant, error: participantError } = await supabase
          .from("conversation_participants")
          .select("*")
          .eq("conversation_id", conversationId)
          .eq("user_id", currentUser.id)
          .single()

        if (participantError) {
          console.error("Error verifying conversation participant:", participantError)
          throw new Error("You are not authorized to view this conversation")
        }

        // Get messages for this conversation
        const { data, error } = await supabase
          .from("messages")
          .select("*, sender:sender_id(*), receiver:receiver_id(*)")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        if (error) {
          console.error("Error fetching messages:", error)
          throw new Error("Failed to fetch messages")
        }

        return data || []
      } catch (error: any) {
        console.error("Error in messages resolver:", error)
        throw new Error("Failed to fetch messages: " + error.message)
      }
    },

    unreadMessageCount: async (_: any, __: any, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser) {
        throw new Error("Authentication required")
      }

      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", currentUser.id)
        .eq("read", false)

      if (error) {
        console.error("Error fetching unread message count:", error)
        throw new Error("Failed to fetch unread message count")
      }

      return count || 0
    },
  },

  Project: {
    students: async (parent: any) => {
      const supabase = createServerClient()

      const { data, error } = await supabase
        .from("project_students")
        .select("student:student_id(id, username, role, university_id)")
        .eq("project_id", parent.id)

      if (error) {
        console.error("Error fetching project students:", error)
        throw new Error("Failed to fetch project students")
      }

      return data.map((item: any) => item.student)
    },
  },

  Mutation: {
    createProject: async (_: any, args: any, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Admin privileges required")
      }

      // Insert project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: args.title,
          description: args.description,
          category_id: args.category_id,
          start_date: args.start_date,
          end_date: args.end_date,
          status: args.status,
          progress: args.status === "Completed" ? 100 : 0,
        })
        .select()
        .single()

      if (projectError) {
        console.error("Error creating project:", projectError)
        throw new Error("Failed to create project")
      }

      // Insert project-student relationships
      if (args.student_ids.length > 0) {
        const projectStudents = args.student_ids.map((student_id: number) => ({
          project_id: project.id,
          student_id,
        }))

        const { error: studentsError } = await supabase.from("project_students").insert(projectStudents)

        if (studentsError) {
          console.error("Error assigning students to project:", studentsError)
          throw new Error("Failed to assign students to project")
        }
      }

      return project
    },

    updateProject: async (_: any, args: any, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Admin privileges required")
      }

      // Update project
      const updateData: any = {}

      if (args.title !== undefined) updateData.title = args.title
      if (args.description !== undefined) updateData.description = args.description
      if (args.category_id !== undefined) updateData.category_id = args.category_id
      if (args.start_date !== undefined) updateData.start_date = args.start_date
      if (args.end_date !== undefined) updateData.end_date = args.end_date
      if (args.status !== undefined) {
        updateData.status = args.status
        if (args.status === "Completed") updateData.progress = 100
      }
      if (args.progress !== undefined) updateData.progress = args.progress

      updateData.updated_at = new Date().toISOString()

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", args.id)
        .select()
        .single()

      if (projectError) {
        console.error("Error updating project:", projectError)
        throw new Error("Failed to update project")
      }

      // Update project-student relationships if student_ids is provided
      if (args.student_ids !== undefined) {
        // Delete existing relationships
        const { error: deleteError } = await supabase.from("project_students").delete().eq("project_id", args.id)

        if (deleteError) {
          console.error("Error removing students from project:", deleteError)
          throw new Error("Failed to update project students")
        }

        // Insert new relationships
        if (args.student_ids.length > 0) {
          const projectStudents = args.student_ids.map((student_id: number) => ({
            project_id: args.id,
            student_id,
          }))

          const { error: insertError } = await supabase.from("project_students").insert(projectStudents)

          if (insertError) {
            console.error("Error assigning students to project:", insertError)
            throw new Error("Failed to update project students")
          }
        }
      }

      return project
    },

    deleteProject: async (_: any, { id }: { id: number }, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Admin privileges required")
      }

      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) {
        console.error("Error deleting project:", error)
        throw new Error("Failed to delete project")
      }

      return true
    },

    createTask: async (_: any, args: any, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Admin privileges required")
      }

      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          project_id: args.project_id,
          name: args.name,
          description: args.description,
          student_id: args.student_id,
          status: args.status,
          due_date: args.due_date,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating task:", error)
        throw new Error("Failed to create task")
      }

      return task
    },

    updateTask: async (_: any, args: any, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Admin privileges required")
      }

      const updateData: any = {}

      if (args.project_id !== undefined) updateData.project_id = args.project_id
      if (args.name !== undefined) updateData.name = args.name
      if (args.description !== undefined) updateData.description = args.description
      if (args.student_id !== undefined) updateData.student_id = args.student_id
      if (args.status !== undefined) updateData.status = args.status
      if (args.due_date !== undefined) updateData.due_date = args.due_date

      updateData.updated_at = new Date().toISOString()

      const { data: task, error } = await supabase.from("tasks").update(updateData).eq("id", args.id).select().single()

      if (error) {
        console.error("Error updating task:", error)
        throw new Error("Failed to update task")
      }

      return task
    },

    deleteTask: async (_: any, { id }: { id: number }, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Admin privileges required")
      }

      const { error } = await supabase.from("tasks").delete().eq("id", id)

      if (error) {
        console.error("Error deleting task:", error)
        throw new Error("Failed to delete task")
      }

      return true
    },

    sendMessage: async (_: any, { receiver_id, content }: { receiver_id: number; content: string }, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser) {
        throw new Error("Authentication required")
      }

      try {
        // Get or create conversation
        const { data: conversationId, error: conversationError } = await supabase.rpc("get_or_create_conversation", {
          user1_id: currentUser.id,
          user2_id: receiver_id,
        })

        if (conversationError) {
          console.error("Error getting or creating conversation:", conversationError)
          throw new Error("Failed to get or create conversation: " + conversationError.message)
        }

        // Send message
        const { data: message, error: messageError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: currentUser.id,
            receiver_id,
            content,
            read: false,
          })
          .select("*, sender:sender_id(*), receiver:receiver_id(*)")
          .single()

        if (messageError) {
          console.error("Error sending message:", messageError)
          throw new Error("Failed to send message: " + messageError.message)
        }

        return message
      } catch (error: any) {
        console.error("Error in sendMessage resolver:", error)
        throw new Error("Failed to send message: " + error.message)
      }
    },

    markMessagesAsRead: async (_: any, { conversation_id }: { conversation_id: number }, context: any) => {
      const supabase = createServerClient()
      const currentUser = context.user

      if (!currentUser) {
        throw new Error("Authentication required")
      }

      try {
        const { error } = await supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", conversation_id)
          .eq("receiver_id", currentUser.id)
          .eq("read", false)

        if (error) {
          console.error("Error marking messages as read:", error)
          throw new Error("Failed to mark messages as read: " + error.message)
        }

        return true
      } catch (error: any) {
        console.error("Error in markMessagesAsRead resolver:", error)
        throw new Error("Failed to mark messages as read: " + error.message)
      }
    },
  },
}
