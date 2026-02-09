import { useEffect, useState } from "react";

export function useTypewriter(params: {
  text: string;
  enabled?: boolean;
  speedMs?: number;
  chunkSize?: number;
}) {
  const { text, enabled = true, speedMs = 18, chunkSize = 2 } = params;
  const [out, setOut] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setOut(text);
      setDone(true);
      return;
    }

    let idx = 0;
    setOut("");
    setDone(false);

    const id = window.setInterval(() => {
      idx = Math.min(text.length, idx + chunkSize);
      setOut(text.slice(0, idx));
      if (idx >= text.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, speedMs);

    return () => window.clearInterval(id);
  }, [chunkSize, enabled, speedMs, text]);

  return { out, done };
}

