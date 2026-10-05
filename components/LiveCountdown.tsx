"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/demo";

export default function LiveCountdown({
  initialSeconds,
  onEnd,
}: {
  initialSeconds: number;
  onEnd?: () => void;
}) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onEnd?.();
      return;
    }
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining <= 0]);

  if (remaining <= 0) {
    return <span className="text-ink-3">Ended</span>;
  }
  return <span>{formatCountdown(remaining)}</span>;
}
