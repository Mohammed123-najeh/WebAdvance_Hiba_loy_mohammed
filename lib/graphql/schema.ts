import { makeExecutableSchema } from "@graphql-tools/schema"
import { resolvers } from "./resolvers"

const typeDefs = `
  type User {
    id: Int!
    username: String!
    role: String!
    university_id: String
    last_seen: String!
  }

  type Category {
    id: Int!
    name: String!
  }

  type Project {
    id: Int!
    title: String!
    description: String
    category: Category
    start_date: String!
    end_date: String!
    status: String!
    progress: Int!
    created_at: String!
    updated_at: String!
    students: [User!]!
  }

  type Task {
    id: Int!
    project: Project!
    name: String!
    description: String
    student: User
    status: String!
    due_date: String!
    created_at: String!
    updated_at: String!
  }

  type ConversationUser {
    id: Int!
    username: String!
    role: String!
    last_seen: String!
  }

  type Conversation {
    id: Int!
    other_user: ConversationUser!
    last_message: String!
    last_message_time: String!
    unread_count: Int!
  }

  type Message {
    id: Int!
    conversation_id: Int!
    sender: User!
    receiver: User!
    content: String!
    read: Boolean!
    created_at: String!
  }

  type Query {
    projects(status: String): [Project!]!
    project(id: Int!): Project
    categories: [Category!]!
    students: [User!]!
    admins: [User!]!
    allUsers: [User!]!
    tasks(status: String): [Task!]!
    task(id: Int!): Task
    conversations: [Conversation!]!
    messages(conversationId: Int!): [Message!]!
    unreadMessageCount: Int!
  }

  type Mutation {
    createProject(
      title: String!
      description: String
      category_id: Int!
      start_date: String!
      end_date: String!
      status: String!
      student_ids: [Int!]!
    ): Project!

    updateProject(
      id: Int!
      title: String
      description: String
      category_id: Int
      start_date: String
      end_date: String
      status: String
      progress: Int
      student_ids: [Int!]
    ): Project!

    deleteProject(id: Int!): Boolean!

    createTask(
      project_id: Int!
      name: String!
      description: String
      student_id: Int
      status: String!
      due_date: String!
    ): Task!

    updateTask(
      id: Int!
      project_id: Int
      name: String
      description: String
      student_id: Int
      status: String
      due_date: String
    ): Task!

    deleteTask(id: Int!): Boolean!

    sendMessage(
      receiver_id: Int!
      content: String!
    ): Message!

    markMessagesAsRead(
      conversation_id: Int!
    ): Boolean!
  }
`

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})
