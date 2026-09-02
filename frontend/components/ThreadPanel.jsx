"use client"

import { useState, useEffect, useRef } from 'react'
import { X, Send } from 'lucide-react'
import ThreadedMessage from './ThreadedMessage'
import UserAvatar from './UserAvatar'
import { getPusherClient, PUSHER_EVENTS } from '../lib/pusher'

export default function ThreadPanel({
  parentMessage,
  groupId,
  authToken,
  currentUser,
  onClose,
  onEdit,
  onDelete
}) {
  const [replies, setReplies] = useState([])
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalRepliesLoaded, setTotalRepliesLoaded] = useState(0)
  const repliesEndRef = useRef(null)
  const repliesContainerRef = useRef(null)
  const pusherRef = useRef(null)
  const isFetchingMoreRef = useRef(false)

  useEffect(() => {
    loadReplies()
    const cleanupPusher = setupPusher()

    return () => {
      // Don't unsubscribe - the channel is shared with GroupChat
      // Just unbind this component's event handlers
      if (cleanupPusher) {
        cleanupPusher()
      }
    }
  }, [parentMessage.id])

  const setupPusher = () => {
    const pusher = getPusherClient()
    if (!pusher) return null

    pusherRef.current = pusher

    // Get or subscribe to the channel (don't unsubscribe, it's shared with GroupChat)
    let channel = pusher.channel(`private-group-${groupId}`)
    if (!channel) {
      channel = pusher.subscribe(`private-group-${groupId}`)
    }

    const onMessageSent = (data) => {
      // Only add if it's a reply to our parent message
      if (data.parentId === parentMessage.id) {
        // Check if message already exists (avoid duplicates for own messages)
        setReplies(prev => {
          const messageExists = prev.some(msg => msg.id === data.id)
          if (messageExists) {
            return prev
          }
          return [...prev, data]
        })
        scrollToBottom()
      }
    }

    const onMessageEdited = (data) => {
      setReplies(prev =>
        prev.map(msg =>
          msg.id === data.messageId ? { ...msg, content: data.newContent, edited: true } : msg
        )
      )
    }

    const onMessageDeleted = (data) => {
      setReplies(prev => prev.filter(msg => msg.id !== data.messageId))
    }

    let hasConnected = false
    const onConnected = () => {
      if (hasConnected) {
        console.log('Pusher reconnected! Resyncing replies...')
        fetch(`/api/groupchat/${groupId}/messages/${parentMessage.id}/thread?limit=20&skip=0`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const repliesArray = Array.isArray(data) ? data : []
          const newReplies = repliesArray.reverse()
          
          setReplies(prev => {
            const merged = [...prev, ...newReplies]
            const map = new Map()
            merged.forEach(msg => map.set(msg.id, msg))
            return Array.from(map.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          })
        })
        .catch(err => console.error('Failed to resync replies:', err))
      }
      hasConnected = true
    }
    
    if (pusher.connection) {
      pusher.connection.bind('connected', onConnected)
    }

    // Listen for new messages in this thread
    channel.bind(PUSHER_EVENTS.MESSAGE_SENT, onMessageSent)
    // Listen for edited messages in this thread
    channel.bind(PUSHER_EVENTS.MESSAGE_EDITED, onMessageEdited)
    // Listen for deleted messages in this thread
    channel.bind(PUSHER_EVENTS.MESSAGE_DELETED, onMessageDeleted)

    return () => {
      if (pusher.connection) {
        pusher.connection.unbind('connected', onConnected)
      }
      channel.unbind(PUSHER_EVENTS.MESSAGE_SENT, onMessageSent)
      channel.unbind(PUSHER_EVENTS.MESSAGE_EDITED, onMessageEdited)
      channel.unbind(PUSHER_EVENTS.MESSAGE_DELETED, onMessageDeleted)
    }
  }

  const loadReplies = async (skip = 0) => {
    try {
      const response = await fetch(`/api/groupchat/${groupId}/messages/${parentMessage.id}/thread?limit=50&skip=${skip}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })

      if (!response.ok) throw new Error('Failed to load thread')

      const data = await response.json()
      const repliesArray = Array.isArray(data) ? data : []
      // The API now returns newest first (DESC) so we must reverse for chronological view
      const newReplies = repliesArray.reverse()

      if (skip === 0) {
        setReplies(newReplies)
        setTotalRepliesLoaded(repliesArray.length)
        setTimeout(scrollToBottom, 0)
      } else {
        const container = repliesContainerRef.current
        const scrollHeightBefore = container?.scrollHeight || 0
        const scrollTopBefore = container?.scrollTop || 0

        setReplies(prev => [...newReplies, ...prev])
        setTotalRepliesLoaded(prev => prev + repliesArray.length)

        setTimeout(() => {
          if (container) {
            const scrollHeightAfter = container.scrollHeight
            const addedHeight = scrollHeightAfter - scrollHeightBefore
            container.scrollTop = scrollTopBefore + addedHeight
          }
        }, 0)
      }

      setHasMore(repliesArray.length === 50)
    } catch (error) {
      console.error('Failed to load thread:', error)
      if (skip === 0) setReplies([])
    } finally {
      if (skip === 0) setLoading(false)
      else setLoadingMore(false)
      isFetchingMoreRef.current = false
    }
  }

  const loadMoreReplies = async () => {
    if (loadingMore || !hasMore || isFetchingMoreRef.current) return

    isFetchingMoreRef.current = true
    setLoadingMore(true)
    
    await loadReplies(totalRepliesLoaded)
  }

  // Detect scroll to top
  useEffect(() => {
    const container = repliesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMore && !loadingMore) {
        loadMoreReplies()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, totalRepliesLoaded])

  const sendReply = async () => {
    if (!replyContent.trim() || sending) return

    const content = replyContent.trim()
    setReplyContent('')
    setSending(true)

    try {
      const response = await fetch(`/api/groupchat/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ content, parentMessageId: parentMessage.id })
      })

      if (!response.ok) throw new Error('Failed to send reply')

      await response.json()
      // Don't add locally - let Pusher handle it to avoid duplicates
      // The reply will appear via Pusher event in real-time
    } catch (error) {
      console.error('Failed to send reply:', error)
      setReplyContent(content)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'Now'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Now'

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 flex h-screen w-full sm:w-96 flex-col border-l border-[var(--surface-2-border)] bg-[var(--surface-2)]">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b px-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold">Thread</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Parent Message */}
        <div className="border-b p-4 dark:border-zinc-800">
          <div className="flex gap-3">
            <UserAvatar
              user={
                currentUser && currentUser.id === parentMessage.createdBy
                  ? currentUser
                  : {
                      id: parentMessage.createdBy,
                      name: parentMessage.userName,
                      email: parentMessage.userEmail
                    }
              }
              size="md"
            />
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {parentMessage.userName || 
                   (currentUser && currentUser.id === parentMessage.createdBy ? (currentUser.name || 'User') : 'User')}
                </span>
                <span>{formatTime(parentMessage.createdAt)}</span>
              </div>
              <div className="text-sm text-zinc-900 dark:text-zinc-100">
                <p className="whitespace-pre-wrap">{parentMessage.content}</p>
              </div>
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div ref={repliesContainerRef} className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            Loading replies...
          </div>
        ) : replies.length === 0 ? (
          <div className="flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            No replies yet. Start the conversation!
          </div>
        ) : (
          <>
            {loadingMore && (
              <div className="flex items-center justify-center py-2 text-sm text-zinc-500 dark:text-zinc-400">
                Loading more replies...
              </div>
            )}
            {replies.map((reply) => (
              <ThreadedMessage
                key={reply.id}
                message={reply}
                currentUserId={currentUser.id}
                currentUser={currentUser}
                onEdit={onEdit}
                onDelete={(id) => {
                  onDelete(id)
                  setReplies(prev => prev.filter(r => r.id !== id))
                }}
                onOpenThread={() => {}}
                isInThread={true}
              />
            ))}
            <div ref={repliesEndRef} />
          </>
        )}
      </div>

        {/* Reply Input */}
        <div className="border-t p-3 sm:p-4 dark:border-zinc-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendReply()
                }
              }}
              placeholder="Reply to thread..."
              disabled={sending}
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-base dark:border-zinc-700 bg-white/50 dark:bg-black/20"
            />
            <button
              onClick={sendReply}
              disabled={!replyContent.trim() || sending}
              className="rounded-lg bg-indigo-500 px-3 py-2 text-white hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
