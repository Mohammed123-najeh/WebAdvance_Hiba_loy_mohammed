import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import ChatPage from "@/components/chat-page"

export default async function Chat() {
  const user = await getSession()

  if (!user) {
    redirect("/signin")
  }

  return <ChatPage user={user} />
}
