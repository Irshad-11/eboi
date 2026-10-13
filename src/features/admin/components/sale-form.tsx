"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { todayInDhaka } from "@/lib/datetime";
import { logSale } from "../actions/sales";
import { Field } from "./field";
import { Notice } from "./notice";

type Book = { id: string; title: string; book_code: string; finalPrice: number };

/** The fastest possible form: pick the book, the price fills itself, press Log. */
export function SaleForm({ books }: { books: Book[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      ref={formRef}
      className="grid gap-4 md:grid-cols-[minmax(0,2fr)_6rem_7rem_10rem_minmax(0,1fr)_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await logSale({
            bookId: String(fd.get("bookId") ?? ""),
            price,
            copies: String(fd.get("copies") ?? "1"),
            soldOn: String(fd.get("soldOn") ?? ""),
            note: String(fd.get("note") ?? ""),
          });
          if (!res.ok) {
            setErrors(res.fieldErrors ?? {});
            setNotice({ tone: "error", text: res.error });
            return;
          }
          setErrors({});
          setNotice({ tone: "ok", text: res.message ?? "Logged." });
          formRef.current?.reset();
          setPrice("");
          router.refresh();
        });
      }}
    >
      <Field label="Book" htmlFor="s-book" error={errors.bookId}>
        <select
          id="s-book"
          name="bookId"
          className="select"
          defaultValue=""
          onChange={(e) => {
            const b = books.find((x) => x.id === e.target.value);
            if (b) setPrice(String(b.finalPrice));
          }}
        >
          <option value="" disabled>
            Pick a book…
          </option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.book_code} · {b.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Price each" htmlFor="s-price" hint="0 for a free book" error={errors.price}>
        <input id="s-price" type="number" min={0} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className="input tnum" />
      </Field>
      <Field label="Copies" htmlFor="s-copies" error={errors.copies}>
        <input id="s-copies" name="copies" type="number" min={1} max={100} defaultValue={1} inputMode="numeric" className="input tnum" />
      </Field>
      <Field label="Date" htmlFor="s-date" error={errors.soldOn}>
        <input id="s-date" name="soldOn" type="date" defaultValue={todayInDhaka()} className="input tnum" />
      </Field>
      <Field label="Note" htmlFor="s-note">
        <input id="s-note" name="note" className="input" placeholder="bKash, repeat buyer…" />
      </Field>
      <button className="btn btn-primary" data-loading={pending} disabled={pending}>
        Log sale
      </button>
      {notice && <Notice tone={notice.tone} className="md:col-span-6 md:order-first">{notice.text}</Notice>}
    </form>
  );
}
