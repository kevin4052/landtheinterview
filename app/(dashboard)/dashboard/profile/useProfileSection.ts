"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEntry, updateEntry, deleteEntry } from "./profileSectionApi";

// The add/edit/delete state machine every collection section shares: at most one
// of "adding a new entry" or "editing entry X" is active at a time, and a
// successful mutation closes the active form and refreshes the server data.
//
// This is the seam the four section components hang off — name the section once
// via `slug`, render a form/list against the returned controller. The network is
// delegated to profileSectionApi (the testable surface); what's left here is the
// React-only glue (transitions + form state) that genuinely needs a hook.
export type ProfileSectionController<TPayload> = {
  isAdding: boolean;
  editingId: string | null;
  startAdd: () => void;
  startEdit: (id: string) => void;
  cancel: () => void;
  create: (payload: TPayload) => Promise<boolean>;
  update: (id: string, payload: TPayload) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
};

export function useProfileSection<TPayload>(slug: string): ProfileSectionController<TPayload> {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const refresh = useCallback(() => startTransition(() => router.refresh()), [router]);

  const create = useCallback(
    async (payload: TPayload): Promise<boolean> => {
      if (!(await createEntry(slug, payload))) return false;
      setIsAdding(false);
      refresh();
      return true;
    },
    [slug, refresh]
  );

  const update = useCallback(
    async (id: string, payload: TPayload): Promise<boolean> => {
      if (!(await updateEntry(slug, id, payload))) return false;
      setEditingId(null);
      refresh();
      return true;
    },
    [slug, refresh]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      if (!(await deleteEntry(slug, id))) return false;
      refresh();
      return true;
    },
    [slug, refresh]
  );

  const startAdd = useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
  }, []);

  const startEdit = useCallback((id: string) => {
    setEditingId(id);
    setIsAdding(false);
  }, []);

  const cancel = useCallback(() => {
    setIsAdding(false);
    setEditingId(null);
  }, []);

  return { isAdding, editingId, startAdd, startEdit, cancel, create, update, remove };
}
