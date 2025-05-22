"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { graphqlRequest } from "@/lib/graphql/client"
import DashboardLayout from "./dashboard-layout"
import { formatDistanceToNow } from "date-fns"
import type { User } from "@/lib/auth"

interface StudentChatPageProps {
  user: User
}

interface Admin {
  id: number
  username: string
}

interface Message {
  id: number
  sender: {
    id: number
    username: string
  }
  receiver: {
    id: number
    username: string
  }
  content: string
  read: boolean
  created_at: string
}

const GET_ADMINS = `
  query GetAdmins {
    admins {
      id
      username
    }
  }
`

const GET_MESSAGES = `
  query GetMessages($userId: Int!) {
    messages(userId: $userId) {
      id
      content
      read
      created_at
      sender {
        id
        username
      }
      receiver {
        id
        username
      }
    }
  }
`

const SEND_MESSAGE = `
  mutation SendMessage($receiver_id: Int!, $content: String!) {
    sendMessage(receiver_id: $receiver_id, content: $content) {
      id
      content
      read
      created_at
      sender {
        id
        username
      }
      receiver {
        id
        username
      }
    }
  }
`

const MARK_MESSAGE_AS_READ = `
  mutation MarkMessageAsRead($id: Int!) {
    markMessageAsRead(id: $id)
  }
`

export default function StudentChatPage({ user }: StudentChatPageProps) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await graphqlRequest(GET_ADMINS)
      setAdmins(data.admins)

      // Select the first admin by default if available
      if (data.admins.length > 0 && !selectedAdmin) {
        setSelectedAdmin(data.admins[0])
      }
    } catch (error: any) {
      console.error("Error fetching admins:", error)
      setError("Failed to load administrators. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (adminId: number) => {
    try {
      const data = await graphqlRequest(GET_MESSAGES, { userId: adminId })
      setMessages(data.messages)

      // Mark unread messages as read
      data.messages.forEach((message: Message) => {
        if (!message.read && message.sender.id === adminId) {
          markMessageAsRead(message.id)
        }
      })
    } catch (error: any) {
      console.error("Error fetching messages:", error)
      setError("Failed to load messages. Please try again later.")
    }
  }

  const markMessageAsRead = async (messageId: number) => {
    try {
      await graphqlRequest(MARK_MESSAGE_AS_READ, { id: messageId })
    } catch (error: any) {
      console.error("Error marking message as read:", error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAdmin || !newMessage.trim()) {
      return
    }

    try {
      const data = await graphqlRequest(SEND_MESSAGE, {
        receiver_id: selectedAdmin.id,
        content: newMessage.trim(),
      })

      setMessages([...messages, data.sendMessage])
      setNewMessage("")
    } catch (error: any) {
      console.error("Error sending message:", error)
      setError("Failed to send message. Please try again.")
    }
  }

  const handleAdminSelect = (admin: Admin) => {
    setSelectedAdmin(admin)
  }

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Fetch admins on component mount
  useEffect(() => {
    fetchAdmins()
  }, [])

  // Fetch messages when selected admin changes
  useEffect(() => {
    if (selectedAdmin) {
      fetchMessages(selectedAdmin.id)
    }
  }, [selectedAdmin])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedAdmin) return

    const interval = setInterval(() => {
      fetchMessages(selectedAdmin.id)
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedAdmin])

  return (
    <DashboardLayout user={user} activePage="chat">
      <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden md:flex-row">
        {/* Admin List - Make it collapsible on mobile */}
        <div
          className={`${selectedAdmin ? "hidden md:block" : "block"} w-full border-b border-border-color bg-card-background md:w-64 md:border-b-0 md:border-r`}
        >
          <h2 className="border-b border-border-color p-3 sm:p-4 text-lg sm:text-xl font-semibold">Administrators</h2>

          {loading && admins.length === 0 ? (
            <div className="flex h-20 items-center justify-center">
              <div className="text-text-muted">Loading administrators...</div>
            </div>
          ) : error && admins.length === 0 ? (
            <div className="p-4 text-danger">{error}</div>
          ) : (
            <div className="flex max-h-[200px] flex-col overflow-y-auto md:max-h-full">
              {admins.map((admin) => (
                <button
                  key={admin.id}
                  onClick={() => handleAdminSelect(admin)}
                  className={`p-4 text-left hover:bg-input-background ${
                    selectedAdmin?.id === admin.id ? "bg-input-background" : ""
                  }`}
                >
                  {admin.username}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area - Make it full screen on mobile when an admin is selected */}
        <div className={`${selectedAdmin ? "block" : "hidden md:block"} flex flex-1 flex-col`}>
          {selectedAdmin ? (
            <>
              {/* Chat Header - Add back button for mobile */}
              <div className="border-b border-border-color p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedAdmin(null)}
                    className="md:hidden p-1 rounded-full hover:bg-input-background"
                    aria-label="Back to administrators"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-lg sm:text-xl font-semibold">Chatting with {selectedAdmin.username}...</h2>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-text-muted">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[80%] rounded p-3 ${
                          message.sender.id === user.id ? "ml-auto bg-primary text-white" : "bg-success text-white"
                        }`}
                      >
                        <div className="mb-1">{message.content}</div>
                        <div className="text-right text-xs text-gray-200">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex border-t border-border-color p-3 sm:p-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-l bg-input-background px-3 py-2 text-foreground placeholder-text-muted focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="rounded-r bg-success px-3 py-2 font-medium text-white hover:bg-success-hover disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              Select an administrator to start chatting
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
