"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Link2, Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import type { CreatorLink } from "@/lib/types";
import {
  getCreatorLinks,
  createCreatorLink,
  deleteCreatorLink,
  reorderCreatorLinks,
} from "@/lib/api";

const MAX_LINKS = 10;

export default function CreatorLinksManager() {
  const { getToken } = useAuth();
  const [links, setLinks] = useState<CreatorLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const data = await getCreatorLinks(token);
        setLinks(data.links);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load links");
      }
    })();
  }, [getToken]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim() || adding) return;
    setAdding(true);
    setError(null);
    try {
      const token = await getToken();
      const { link } = await createCreatorLink(token, { title: title.trim(), url: url.trim() });
      setLinks((prev) => [...(prev ?? []), link]);
      setTitle("");
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add link");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const token = await getToken();
      await deleteCreatorLink(token, id);
      setLinks((prev) => prev?.filter((l) => l.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete link");
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!links) return;
    const target = index + direction;
    if (target < 0 || target >= links.length) return;

    const reordered = [...links];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setLinks(reordered); // optimistic

    try {
      const token = await getToken();
      await reorderCreatorLinks(token, reordered.map((l) => l.id));
    } catch (err) {
      setLinks(links); // rollback
      setError(err instanceof Error ? err.message : "Could not reorder links");
    }
  }

  return (
    <div>
      <h3 className="flex items-center gap-2 text-white font-semibold text-sm mb-1">
        <Link2 size={16} className="text-gold-400" /> Links
      </h3>
      <p className="text-zinc-500 text-xs mb-4">
        Add up to {MAX_LINKS} links (socials, merch, anything) — they&apos;ll appear on your videos
        once the links shelf ships.
      </p>

      {error && (
        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {links === null ? (
        <div className="space-y-2">
          {[0, 1].map((i) => <div key={i} className="skeleton h-11 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {links.map((link, i) => (
            <div
              key={link.id}
              className="flex items-center gap-2 bg-surface-100 border border-gold-400/10 rounded-xl px-3 py-2.5"
            >
              <GripVertical size={14} className="text-zinc-700 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{link.title}</p>
                <p className="text-zinc-500 text-xs truncate">{link.url}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1.5 text-zinc-500 hover:text-gold-400 disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
                  aria-label="Move up"
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === links.length - 1}
                  className="p-1.5 text-zinc-500 hover:text-gold-400 disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
                  aria-label="Move down"
                >
                  <ChevronDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  disabled={busyId === link.id}
                  className="p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                  aria-label="Delete link"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {links.length === 0 && (
            <p className="text-zinc-600 text-sm py-2">No links yet.</p>
          )}
        </div>
      )}

      {(links?.length ?? 0) < MAX_LINKS && (
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Instagram)"
            maxLength={100}
            className="flex-1 bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none"
          />
          <button
            type="submit"
            disabled={!title.trim() || !url.trim() || adding}
            className="shrink-0 flex items-center justify-center gap-1.5 bg-gold-400/15 hover:bg-gold-400/25 text-gold-300 border border-gold-400/30 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40"
          >
            <Plus size={15} /> Add
          </button>
        </form>
      )}
    </div>
  );
}
