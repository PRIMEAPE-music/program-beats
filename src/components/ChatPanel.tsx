import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import type { ChatMessage, GeneratedPattern } from '../engine/types';

export const ChatPanel: React.FC = () => {
  const project = useProjectStore((s) => s.project);
  const chatMessages = useProjectStore((s) => s.chatMessages);
  const isChatLoading = useProjectStore((s) => s.isChatLoading);
  const addChatMessage = useProjectStore((s) => s.addChatMessage);
  const setChatLoading = useProjectStore((s) => s.setChatLoading);
  const addClip = useProjectStore((s) => s.addClip);
  const placeClip = useProjectStore((s) => s.placeClip);
  const selectClip = useProjectStore((s) => s.selectClip);
  const selectTrack = useProjectStore((s) => s.selectTrack);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addChatMessage(userMessage);
    setInput('');
    setChatLoading(true);

    try {
      // Build context about current project state
      const trackContext = project.tracks.map((t) => ({
        name: t.name,
        type: t.type,
        patternCount: Object.keys(t.clips).length,
      }));

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          context: {
            bpm: project.bpm,
            tracks: trackContext,
            existingPatterns: Object.values(project.clips).map((c) => ({
              name: c.name,
              pattern: c.pattern,
            })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || 'Here are some patterns:',
        patterns: data.patterns as GeneratedPattern[] | undefined,
        timestamp: Date.now(),
      };
      addChatMessage(assistantMessage);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Make sure the server is running.`,
        timestamp: Date.now(),
      };
      addChatMessage(errorMessage);
    } finally {
      setChatLoading(false);
    }
  }, [input, isChatLoading, project, addChatMessage, setChatLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleApplyPattern = useCallback(
    (pattern: GeneratedPattern) => {
      // Find a matching track or use the first one
      const matchingTrack =
        project.tracks.find((t) => t.type === pattern.trackType) ||
        project.tracks[0];
      if (!matchingTrack) return;

      // Find the next empty bar on that track
      let nextBar = 0;
      while (matchingTrack.clips[nextBar] !== undefined && nextBar < project.totalBars) {
        nextBar++;
      }
      if (nextBar >= project.totalBars) nextBar = 0;

      const newClip = {
        id: crypto.randomUUID(),
        name: pattern.description.slice(0, 30) || `${pattern.trackType} pattern`,
        pattern: pattern.pattern,
        color: '#e94560',
        durationBars: 1,
      };

      addClip(newClip);
      placeClip(matchingTrack.id, nextBar, newClip.id);
      selectTrack(matchingTrack.id);
      selectClip(newClip.id);
    },
    [project, addClip, placeClip, selectTrack, selectClip]
  );

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <span className="ai-dot" />
        AI Assistant
      </div>

      <div className="chat-messages">
        {chatMessages.length === 0 && (
          <div style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', marginTop: 40 }}>
            Ask the AI to generate Strudel patterns.
            <br />
            Try: "Make a funky drum beat at 120bpm"
          </div>
        )}

        {chatMessages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.role}`}>
            <div>{msg.content}</div>

            {msg.patterns?.map((pattern, idx) => (
              <div key={idx}>
                <pre className="pattern-block">{pattern.pattern}</pre>
                <div className="pattern-meta">
                  <span className="pattern-desc">
                    {pattern.trackType}: {pattern.description}
                  </span>
                  <button
                    className="btn btn-sm btn-accent"
                    onClick={() => handleApplyPattern(pattern)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {isChatLoading && (
          <div className="chat-loading">
            <div className="dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            Generating patterns...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          rows={1}
          placeholder="Describe a pattern..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isChatLoading}
        />
        <button
          className="btn btn-accent"
          onClick={handleSend}
          disabled={isChatLoading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};
