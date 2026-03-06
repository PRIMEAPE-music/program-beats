import React, { useState, useEffect, useCallback } from 'react';

type AIProvider = 'claude' | 'gemini';

interface ProviderState {
  current: AIProvider;
  available: AIProvider[];
}

export const AIProviderSelector: React.FC = () => {
  const [state, setState] = useState<ProviderState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/ai/provider')
      .then((res) => res.json())
      .then((data) => setState(data))
      .catch(() => setState(null));
  }, []);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value as AIProvider;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) {
        const data = await res.json();
        setState((prev) => prev ? { ...prev, current: data.current } : null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  if (!state || state.available.length <= 1) return null;

  return (
    <select
      className="ai-provider-select"
      value={state.current}
      onChange={handleChange}
      disabled={loading}
      title="Select AI provider"
    >
      {state.available.map((p) => (
        <option key={p} value={p}>
          {p === 'claude' ? 'Claude' : 'Gemini'}
        </option>
      ))}
    </select>
  );
};
