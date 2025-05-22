export async function graphqlRequest(query: string, variables?: Record<string, any>) {
  try {
    // Add a timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const result = await response.json()

    if (result.errors) {
      console.error("GraphQL errors:", result.errors)
      throw new Error(result.errors[0]?.message || "GraphQL error")
    }

    return result.data
  } catch (error: any) {
    console.error("Error in graphqlRequest:", error)
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.")
    }
    throw new Error(`GraphQL request failed: ${error.message}`)
  }
}
