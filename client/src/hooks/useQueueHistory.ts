import { useEffect, useCallback } from 'react';

const STORAGE_KEY = 'qease_queue_history';
const MAX_HISTORY = 10; // keep last 10 visits

export interface QueueHistoryEntry {
  id: string;              // unique entry id
  tokenNumber: string;
  tokenId: string;
  tenantSlug: string;
  tenantName: string;
  serviceName: string;
  status: 'WAITING' | 'SERVING' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' | 'HOLD';
  visitedAt: string;       // ISO timestamp of when customer first opened this page
  completedAt?: string;    // ISO timestamp if service was completed
}

/** Read the full history list from localStorage */
export function readHistory(): QueueHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueueHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/** Persist a history list to localStorage */
function writeHistory(entries: QueueHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage quota — silently ignore
  }
}

/**
 * Hook: automatically records a queue visit when the component mounts,
 * and provides helpers to update status or clear history.
 */
export function useQueueHistory(entry: Omit<QueueHistoryEntry, 'id' | 'visitedAt'> | null) {
  /** Upsert this token into history on mount */
  useEffect(() => {
    if (!entry) return;

    const history = readHistory();

    // Check if this token is already recorded
    const existingIdx = history.findIndex(
      (h) => h.tokenId === entry.tokenId && h.tenantSlug === entry.tenantSlug
    );

    if (existingIdx >= 0) {
      // Update status only
      history[existingIdx].status = entry.status;
      if (entry.status === 'COMPLETED' || entry.status === 'NO_SHOW' || entry.status === 'CANCELLED') {
        history[existingIdx].completedAt = new Date().toISOString();
      }
    } else {
      // Prepend new entry
      const newEntry: QueueHistoryEntry = {
        ...entry,
        id: `qhist-${Date.now()}`,
        visitedAt: new Date().toISOString(),
      };
      history.unshift(newEntry);
    }

    // Trim to max size
    writeHistory(history.slice(0, MAX_HISTORY));
  }, [entry?.tokenId, entry?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Clear all history */
  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /** Remove a single entry by id */
  const removeEntry = useCallback((id: string) => {
    const history = readHistory().filter((h) => h.id !== id);
    writeHistory(history);
  }, []);

  return { clearHistory, removeEntry };
}
