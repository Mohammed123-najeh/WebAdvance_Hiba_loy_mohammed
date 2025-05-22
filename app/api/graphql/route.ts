import type { NextRequest } from "next/server"
import { createYoga } from "graphql-yoga"
import { makeExecutableSchema } from "@graphql-tools/schema"
import { typeDefs } from "@/lib/graphql/typeDefs"
import { resolvers } from "@/lib/graphql/resolvers"
import { getSession } from "@/lib/auth"

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Request, Response },
  context: async ({ request }) => {
    try {
      // Get the user from the session
      const user = await getSession()
      return { user }
    } catch (error) {
      console.error("Error getting session:", error)
      return {} // Return empty context if session retrieval fails
    }
  },
  landingPage: false,
  cors: false,
})

export async function GET(request: NextRequest) {
  try {
    return await handleRequest(request, { method: "GET" })
  } catch (error) {
    console.error("Error handling GraphQL GET request:", error)
    return new Response(
      JSON.stringify({
        errors: [{ message: `Internal server error: ${error}` }],
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handleRequest(request, { method: "POST" })
  } catch (error) {
    console.error("Error handling GraphQL POST request:", error)
    return new Response(
      JSON.stringify({
        errors: [{ message: `Internal server error: ${error}` }],
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

export const runtime = "nodejs"
