"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IconArrowDown, IconArrowUp } from "@/components/icons";
import type { ActionResult } from "../action-result";
import { Notice } from "./notice";

/**
 * A list whose order can be changed with up/down buttons (keyboard and
 * touch friendly, no drag-and-drop needed), saved in one go.
 */
export function OrderList<T extends { id: string }>({
  items,
  render,
  onSave,
  empty,
}: {
  items: T[];
  render: (item: T) => ReactNode;
  onSave: (ids: string[]) => Promise<ActionResult>;
  empty: ReactNode;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(items.map((i) => i.id));
  const [known, setKnown] = useState(items.map((i) => i.id).join());
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const key = items.map((i) => i.id).join();
  if (key !== known) {
    setKnown(key);
    setOrder(items.map((i) => i.id));
  }
  const byId = new Map(items.map((i) => [i.id, i]));
  const dirty = order.join() !== key;
  const move = (i: number, d: -1 | 1) =>
    setOrder((o) => {
      const j = i + d;
      if (j < 0 || j >= o.length) return o;
      const n = [...o];
      [n[i], n[j]] = [n[j]!, n[i]!];
      return n;
    });

  if (!items.length) return <>{empty}</>;
  return (
    <div>
      <ul className="divide-y divide-line">
        {order.map((id, i) => {
          const item = byId.get(id);
          if (!item) return null;
          return (
            <li key={id} className="flex items-center gap-2 px-3 py-2.5 md:px-4">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn btn-ghost btn-icon btn-sm h-7 min-h-7" aria-label="Move up">
                  <IconArrowUp size={14} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} className="btn btn-ghost btn-icon btn-sm h-7 min-h-7" aria-label="Move down">
                  <IconArrowDown size={14} />
                </button>
              </div>
              <div className="min-w-0 flex-1">{render(item)}</div>
            </li>
          );
        })}
      </ul>
      {(dirty || notice) && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
          {dirty && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              data-loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await onSave(order);
                  setNotice(res.ok ? { tone: "ok", text: res.message ?? "Saved." } : { tone: "error", text: res.error });
                  router.refresh();
                })
              }
            >
              Save order
            </button>
          )}
          {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
        </div>
      )}
    </div>
  );
}
