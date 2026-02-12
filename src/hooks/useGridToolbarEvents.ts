import { useEffect } from 'react';
import PubSub from 'pubsub-js';
import { TOPICS, ToolbarPayload } from '../events/topics';

export type GridContext = 'main' | 'subgrid';

export interface UseGridToolbarEventsOptions {
  context: GridContext;
  gridId?: string | number | null;
  // handlers
  onEdit?: (recordId?: string | null) => void | Promise<void>;
  onSave?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onDeleteTemplate?: () => void | Promise<void>;
}

function matchesScope(payload: unknown, context: GridContext, gridId?: string | number | null) {
  // Back-compat: if no payload provided, only main grid handles it
  if (payload == null) return context === 'main';
  const p = (payload || {}) as ToolbarPayload;
  if (p.context && p.context !== context) return false;
  if (typeof p.gridId !== 'undefined' && p.gridId !== gridId) return false;
  return true;
}

export function useGridToolbarEvents({ context, gridId, onEdit, onSave, onDelete, onDeleteTemplate }: UseGridToolbarEventsOptions) {
  // Edit
  useEffect(() => {
    if (!onEdit) return;
    const token = PubSub.subscribe(TOPICS.EDIT_RECORD, (_msg: string, payload: unknown) => {
      if (matchesScope(payload, context, gridId)) {
        const p = (payload || {}) as ToolbarPayload;
        onEdit(p.recordId);
      }
    });
    return () => { PubSub.unsubscribe(token); };
  }, [context, gridId, onEdit]);

  // Save
  useEffect(() => {
    if (!onSave) return;
    const token = PubSub.subscribe(TOPICS.SAVE_RECORDS, (_msg: string, payload: unknown) => {
      if (matchesScope(payload, context, gridId)) onSave();
    });
    return () => { PubSub.unsubscribe(token); };
  }, [context, gridId, onSave]);

  // Delete
  useEffect(() => {
    if (!onDelete) return;
    const token = PubSub.subscribe(TOPICS.DELETE_RECORDS, (_msg: string, payload: unknown) => {
      if (matchesScope(payload, context, gridId)) onDelete();
    });
    return () => { PubSub.unsubscribe(token); };
  }, [context, gridId, onDelete]);

  // Delete Template (no grid scoping typically, but allow context check if provided)
  useEffect(() => {
    if (!onDeleteTemplate) return;
    const token = PubSub.subscribe(TOPICS.DELETE_TEMPLATE, (_msg: string, payload: unknown) => {
      // template deletion is global, but respect context/gridId if publisher provided them
      if (matchesScope(payload, context, gridId)) onDeleteTemplate();
    });
    return () => { PubSub.unsubscribe(token); };
  }, [context, gridId, onDeleteTemplate]);
}
