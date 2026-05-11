'use client'

import { useState, useRef, useEffect } from 'react'
import type { Account } from '@/app/page'

type Message = { role: 'user' | 'assistant'; text: string }

const QUICK_PROMPTS = [
  { label: "Brief me on this account", icon: "⚡" },
  { label: "What are the risks?", icon: "⚠" },
  { label: "What's at risk across all accounts?", icon: "🔴" },
  { label: "What should I focus on today?", icon: "🎯" },
]

type Props = { account: Account | null }

export function AICopilotPanel({ account }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Sales Copilot ready. Select an account and ask me to brief you, flag risks, or take action on any project.",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return

    const contextualText = account
      ? `[Context: viewing ${account.name} account with ${account.projects.length} projects, health score ${account.healthScore} (${account.healthLabel})]\n\n${text}`
      : text

    setMessages(m => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/sf/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: contextualText }),
      })
      const data = await res.json()
      setMessages(m => [...m, {
        role: 'assistant',
        text: data.reply ?? data.error ?? 'Something went wrong.',
      }])
    } catch {
      setMessages(m => [...m, {
        role: 'assistant',
        text: 'Could not reach Salesforce. Check your connection.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: 320,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-panel)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent-cyan)',
            boxShadow: '0 0 8px var(--accent-cyan)',
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.1px' }}>
            AI Copilot
          </span>
          <span style={{
            fontSize: 9, color: 'var(--accent-cyan)',
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: 10, padding: '2px 6px', marginLeft: 'auto',
            fontWeight: 600, letterSpacing: 0.3,
          }}>
            CLAUDE
          </span>
        </div>
        {account && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0' }}>
            Context: <span style={{ color: 'var(--accent-cyan)' }}>{account.name}</span>
          </p>
        )}
      </div>

      {/* Quick prompts */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', flexWrap: 'wrap', gap: 6,
        flexShrink: 0,
      }}>
        {QUICK_PROMPTS.map(p => (
          <button
            key={p.label}
            onClick={() => send(p.label)}
            disabled={loading}
            style={{
              fontSize: 10, padding: '5px 10px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-bright)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
              e.currentTarget.style.color = 'var(--accent-blue)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.borderColor = 'var(--border-bright)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 10,
            }}
            className="animate-slide-in"
          >
            <div style={{
              maxWidth: '85%',
              padding: '9px 13px',
              borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              fontSize: 12,
              lineHeight: 1.6,
              ...(m.role === 'user'
                ? {
                    background: 'rgba(59,130,246,0.2)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    color: '#bfdbfe',
                  }
                : {
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }
              ),
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{
              padding: '10px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px 14px 14px 4px',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 5, height: 5,
                  borderRadius: '50%',
                  background: 'var(--accent-cyan)',
                  display: 'inline-block',
                  animation: `pulse-glow 1.2s ease ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          rows={1}
          placeholder="Ask about any project or account…"
          disabled={loading}
          style={{
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-bright)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'none',
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          style={{
            width: 34, height: 34,
            borderRadius: 10,
            background: input.trim() ? 'var(--accent-blue)' : 'rgba(255,255,255,0.06)',
            border: 'none',
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15,
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>

      {/* Headless 360 badge */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          fontSize: 9, color: 'var(--text-muted)',
        }}>
          <span>Powered by</span>
          {['Voice', 'Web', 'Teams'].map((s, i) => (
            <span key={s} style={{
              padding: '2px 6px',
              borderRadius: 4,
              background: i === 1 ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${i === 1 ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
              color: i === 1 ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontWeight: i === 1 ? 700 : 400,
            }}>{s}</span>
          ))}
          <span>· same Apex layer</span>
        </div>
      </div>
    </div>
  )
}
