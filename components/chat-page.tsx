"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/auth"
import { graphqlRequest } from "@/lib/graphql/client"
import { formatDistanceToNow } from "date-fns"
import DashboardLayout from "./dashboard-layout"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface ChatPageProps {
  user: User
}

interface ChatUser {
  id: number
  username: string
  role: string
  last_seen: string
}

interface Conversation {
  id: number
  other_user: ChatUser
  last_message: string
  last_message_time: string
  unread_count: number
}

interface Message {
  id: number
  conversation_id: number
  sender: ChatUser
  receiver: ChatUser
  content: string
  read: boolean
  created_at: string
}

const GET_CONVERSATIONS = `
  query GetConversations {
    conversations {
      id
      other_user {
        id
        username
        role
        last_seen
      }
      last_message
      last_message_time
      unread_count
    }
  }
`

const GET_ALL_USERS = `
  query GetAllUsers {
    allUsers {
      id
      username
      role
    }
  }
`

const GET_MESSAGES = `
  query GetMessages($conversationId: Int!) {
    messages(conversationId: $conversationId) {
      id
      conversation_id
      content
      read
      created_at
      sender {
        id
        username
        role
      }
      receiver {
        id
        username
        role
      }
    }
  }
`

const SEND_MESSAGE = `
  mutation SendMessage($receiver_id: Int!, $content: String!) {
    sendMessage(receiver_id: $receiver_id, content: $content) {
      id
      conversation_id
      content
      read
      created_at
      sender {
        id
        username
        role
      }
      receiver {
        id
        username
        role
      }
    }
  }
`

const MARK_MESSAGES_AS_READ = `
  mutation MarkMessagesAsRead($conversation_id: Int!) {
    markMessagesAsRead(conversation_id: $conversation_id)
  }
`

export default function ChatPage({ user }: ChatPageProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [allUsers, setAllUsers] = useState<ChatUser[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await graphqlRequest(GET_CONVERSATIONS)

      if (data && data.conversations) {
        setConversations(data.conversations)

        // If we have conversations but none selected, select the first one
        if (data.conversations.length > 0 && !selectedConversation) {
          setSelectedConversation(data.conversations[0])
          fetchMessages(data.conversations[0].id)
        }
      } else {
        setConversations([])
      }
    } catch (error: any) {
      console.error("Error fetching conversations:", error)
      setError("Failed to load conversations. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const data = await graphqlRequest(GET_ALL_USERS)
      if (data && data.allUsers) {
        setAllUsers(data.allUsers)
      } else {
        setAllUsers([])
      }
    } catch (error: any) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      const data = await graphqlRequest(GET_MESSAGES, { conversationId })

      if (data && data.messages) {
        setMessages(data.messages)

        // Mark messages as read
        if (data.messages.length > 0) {
          markMessagesAsRead(conversationId)
        }
      } else {
        setMessages([])
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error)
      setError("Failed to load messages. Please try again later.")
    }
  }

  const markMessagesAsRead = async (conversationId: number) => {
    try {
      await graphqlRequest(MARK_MESSAGES_AS_READ, { conversation_id: conversationId })

      // Update the unread count in the conversations list
      setConversations((prevConversations) =>
        prevConversations.map((conv) => (conv.id === conversationId ? { ...conv, unread_count: 0 } : conv)),
      )
    } catch (error: any) {
      console.error("Error marking messages as read:", error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedConversation || !newMessage.trim() || sending) {
      return
    }

    try {
      setSending(true)
      const data = await graphqlRequest(SEND_MESSAGE, {
        receiver_id: selectedConversation.other_user.id,
        content: newMessage.trim(),
      })

      if (data && data.sendMessage) {
        // Add the new message to the messages list
        setMessages((prevMessages) => [...prevMessages, data.sendMessage])
        setNewMessage("")

        // Update the conversation with the new message
        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  last_message: data.sendMessage.content,
                  last_message_time: data.sendMessage.created_at,
                }
              : conv,
          ),
        )
      }
    } catch (error: any) {
      console.error("Error sending message:", error)
      setError("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const handleStartNewChat = async (chatUser: ChatUser) => {
    try {
      // Send an initial message to create the conversation
      const data = await graphqlRequest(SEND_MESSAGE, {
        receiver_id: chatUser.id,
        content: "👋 Hello!",
      })

      if (data && data.sendMessage) {
        // Refresh conversations
        await fetchConversations()

        // Find the new conversation
        const newConversation = {
          id: data.sendMessage.conversation_id,
          other_user: chatUser,
          last_message: data.sendMessage.content,
          last_message_time: data.sendMessage.created_at,
          unread_count: 0,
        }

        // Add the new conversation to the list
        setConversations((prevConversations) => [newConversation, ...prevConversations])

        // Select the new conversation
        setSelectedConversation(newConversation)

        // Fetch messages for the new conversation
        fetchMessages(data.sendMessage.conversation_id)

        // Hide the new chat panel
        setShowNewChat(false)
      }
    } catch (error: any) {
      console.error("Error starting new chat:", error)
      setError("Failed to start new chat. Please try again.")
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setError(null)
    fetchMessages(conversation.id)
  }

  const getLastSeenStatus = (lastSeen: string | null | undefined) => {
    // Check if lastSeen is valid
    if (!lastSeen) {
      return { status: "Unknown", text: "Unknown" }
    }

    try {
      const lastSeenDate = new Date(lastSeen)

      // Check if the date is valid
      if (isNaN(lastSeenDate.getTime())) {
        return { status: "Unknown", text: "Unknown" }
      }

      const now = new Date()
      const diff = now.getTime() - lastSeenDate.getTime()
      const minutes = Math.floor(diff / (1000 * 60))

      if (minutes < 5) {
        return { status: "Online", text: "Online" }
      } else if (minutes < 60) {
        return { status: "Away", text: `${minutes} min ago` }
      } else {
        return {
          status: "Offline",
          text: formatDistanceToNow(lastSeenDate, { addSuffix: true }),
        }
      }
    } catch (error) {
      console.error("Error parsing last seen date:", error, lastSeen)
      return { status: "Unknown", text: "Unknown" }
    }
  }

  // Set up WebSocket subscription
  useEffect(() => {
    // Create a channel for real-time updates
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as any

          // Check if the message is for the current user
          if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id) {
            // Refresh conversations to update the list
            fetchConversations()

            // If this message is for the currently selected conversation, fetch the messages
            if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
              fetchMessages(selectedConversation.id)
            }
          }
        },
      )
      .subscribe()

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id, selectedConversation])

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Fetch conversations and users on component mount
  useEffect(() => {
    fetchConversations()
    fetchAllUsers()
  }, [])

  return (
    <DashboardLayout user={user} activePage="chat">
      <div className="flex h-full flex-col md:flex-row overflow-hidden rounded-lg border border-[#333] bg-[#1a1a1a]">
        <div className="flex flex-1 overflow-hidden">
          {/* Conversations List - Make it collapsible on mobile */}
          <div
            className={`${selectedConversation ? "hidden md:block" : "block"} w-full md:w-64 md:min-w-[16rem] overflow-y-auto border-r border-[#333] bg-[#222]`}
          >
            {/* Conversations header */}
            <div className="sticky top-0 border-b border-[#333] bg-[#222] p-3 sm:p-4">
              <h2 className="mb-2 text-lg sm:text-xl font-semibold">Conversations</h2>
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="w-full rounded bg-blue-500 px-3 py-2 font-medium text-white hover:bg-blue-600"
              >
                {showNewChat ? "Cancel" : "New Chat"}
              </button>
            </div>

            {showNewChat ? (
              <div className="p-2">
                <h3 className="mb-2 font-medium">Select a user to chat with:</h3>
                {allUsers.length === 0 ? (
                  <div className="text-gray-400">No users available</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {allUsers.map((chatUser) => (
                      <button
                        key={chatUser.id}
                        onClick={() => handleStartNewChat(chatUser)}
                        className="flex items-center rounded p-2 text-left hover:bg-[#333]"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{chatUser.username}</div>
                          <div className="text-xs text-gray-400">{chatUser.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : loading ? (
              <div className="flex h-20 items-center justify-center">
                <div className="text-gray-400">Loading conversations...</div>
              </div>
            ) : error && conversations.length === 0 ? (
              <div className="p-4 text-red-500">{error}</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-gray-400">No conversations yet. Start a new chat!</div>
            ) : (
              <div className="flex flex-col">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`relative flex flex-col border-b border-[#333] p-3 text-left hover:bg-[#333] ${
                      selectedConversation?.id === conversation.id ? "bg-[#333]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{conversation.other_user.username}</div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            getLastSeenStatus(conversation.other_user.last_seen).status === "Online"
                              ? "bg-green-500"
                              : getLastSeenStatus(conversation.other_user.last_seen).status === "Away"
                                ? "bg-yellow-500"
                                : getLastSeenStatus(conversation.other_user.last_seen).status === "Unknown"
                                  ? "bg-gray-400"
                                  : "bg-gray-500"
                          }`}
                        />
                        <div className="text-xs text-gray-400">
                          {getLastSeenStatus(conversation.other_user.last_seen).text}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-gray-300 line-clamp-1">{conversation.last_message}</div>
                    <div className="text-xs text-gray-400">{conversation.other_user.role}</div>

                    {conversation.unread_count > 0 && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                        {conversation.unread_count}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area - Make it full screen on mobile when a conversation is selected */}
          <div className={`${selectedConversation ? "block" : "hidden md:block"} flex flex-1 flex-col overflow-hidden`}>
            {selectedConversation ? (
              <>
                {/* Chat Header - Add back button for mobile */}
                <div className="border-b border-[#333] bg-[#222] p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-1 rounded-full hover:bg-[#333]"
                        aria-label="Back to conversations"
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
                      <h2 className="text-lg sm:text-xl font-semibold">{selectedConversation.other_user.username}</h2>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">{selectedConversation.other_user.role}</div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4"
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center text-gray-400">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.sender.id === user.id ? "ml-auto bg-blue-600 text-white" : "bg-green-500 text-white"
                          }`}
                        >
                          <div className="mb-1 break-words">{message.content}</div>
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
                <form onSubmit={handleSendMessage} className="flex border-t border-[#333] bg-[#222] p-3 sm:p-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-l bg-[#333] px-3 py-2 text-white placeholder-gray-400 focus:outline-none"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="rounded-r bg-green-500 px-3 py-2 font-medium text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                {showNewChat
                  ? "Select a user from the list to start a new chat"
                  : "Select a conversation or start a new chat"}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
