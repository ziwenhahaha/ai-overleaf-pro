import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import RailPanelHeader from '@/features/ide-react/components/rail/rail-panel-header'
import { postJSON } from '@/infrastructure/fetch-json'
import MaterialIcon from '@/shared/components/material-icon'
import OLIconButton from '@/shared/components/ol/ol-icon-button'
import { useIdeContext } from '@/shared/context/ide-context'
import { useProjectContext } from '@/shared/context/project-context'

const MAX_CONTEXT_DOCUMENT_LENGTH = 60_000
const MAX_CONTEXT_SELECTION_LENGTH = 12_000

type AiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type AiChatResponse = {
  reply: string
  sessionId?: string
}

function newMessage(role: AiMessage['role'], content: string): AiMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  }
}

export default function AiChatPane() {
  const { projectId, name: projectName } = useProjectContext()
  const { unstableStore } = useIdeContext()
  const sessionStorageKey = useMemo(
    () => `claude-code-ai-chat-session-${projectId}`,
    [projectId]
  )
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | undefined>(() => {
    try {
      return window.localStorage.getItem(sessionStorageKey) || undefined
    } catch {
      return undefined
    }
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    try {
      if (sessionId) {
        window.localStorage.setItem(sessionStorageKey, sessionId)
      } else {
        window.localStorage.removeItem(sessionStorageKey)
      }
    } catch {
      // localStorage may be unavailable in privacy-restricted contexts
    }
  }, [sessionId, sessionStorageKey])

  const resetConversation = () => {
    setMessages([])
    setSessionId(undefined)
    setError(null)
  }

  const readEditorContext = () => {
    const view = unstableStore.get('editor.view')
    const state = view?.state
    const document = state?.doc?.toString?.() || ''
    const selectionRange = state?.selection?.main
    let selection = ''

    if (
      selectionRange &&
      selectionRange.from !== selectionRange.to &&
      state?.doc?.sliceString
    ) {
      selection = state.doc.sliceString(selectionRange.from, selectionRange.to)
    }

    return {
      projectName: projectName || '',
      fileName: unstableStore.get('editor.open_doc_name') || '',
      selection: selection.slice(0, MAX_CONTEXT_SELECTION_LENGTH),
      document: document.slice(0, MAX_CONTEXT_DOCUMENT_LENGTH),
    }
  }

  const send = async () => {
    const message = input.trim()
    if (!message || sending) {
      return
    }

    const userMessage = newMessage('user', message)
    setMessages(current => [...current, userMessage])
    setInput('')
    setSending(true)
    setError(null)

    try {
      const result = await postJSON<AiChatResponse>(
        `/project/${projectId}/ai-chat`,
        {
          body: {
            message,
            sessionId,
            resume: Boolean(sessionId),
            context: readEditorContext(),
          },
        }
      )

      setMessages(current => [
        ...current,
        newMessage('assistant', result.reply),
      ])
      if (result.sessionId) {
        setSessionId(result.sessionId)
      }
    } catch (requestError: any) {
      const requestErrorMessage =
        requestError?.data?.error ||
        requestError?.message ||
        'Claude Code request failed.'
      setError(requestErrorMessage)
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <div className="ai-chat-panel">
      <RailPanelHeader
        title={
          <span className="ai-chat-title">
            Claude Code
            <span
              className="ai-chat-status"
              title="Uses the Claude Code login on the server host"
            >
              local
            </span>
          </span>
        }
        actions={
          <OLIconButton
            onClick={resetConversation}
            icon="delete"
            accessibilityLabel="Start a new Claude Code conversation"
            size="sm"
            className="rail-panel-header-button-subdued"
          />
        }
      />

      <div className="ai-chat-messages" aria-live="polite">
        {messages.length === 0 && (
          <div className="ai-chat-empty-state">
            <MaterialIcon
              type="smart_toy"
              unfilled
              className="ai-chat-empty-icon"
            />
            <strong>Ask Claude about this paper</strong>
            <p>
              The current LaTeX file and selected text are attached
              automatically.
            </p>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`ai-chat-message ai-chat-message-${message.role}`}
          >
            <div className="ai-chat-message-role">
              {message.role === 'user' ? 'You' : 'Claude'}
            </div>
            <div className="ai-chat-message-content">{message.content}</div>
          </div>
        ))}

        {sending && (
          <div className="ai-chat-message ai-chat-message-assistant">
            <div className="ai-chat-message-role">Claude</div>
            <div className="ai-chat-thinking">
              <span
                className="spinner-border spinner-border-sm"
                aria-hidden="true"
              />
              Thinking…
            </div>
          </div>
        )}

        {error && <div className="alert alert-danger ai-chat-error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <form className="ai-chat-composer" onSubmit={handleSubmit}>
        <textarea
          className="form-control ai-chat-input"
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Claude Code…"
          rows={3}
          disabled={sending}
          aria-label="Message Claude Code"
        />
        <div className="ai-chat-composer-footer">
          <span className="ai-chat-context-hint">Current file + selection</span>
          <button
            className="btn btn-primary btn-sm"
            type="submit"
            disabled={sending || !input.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
