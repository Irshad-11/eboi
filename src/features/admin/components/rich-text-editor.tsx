"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { cn } from "@/lib/cn";

type Props = {
  id: string;
  value: string;
  onChange: (html: string) => void;
  /** Minimum editor height in rem. */
  minHeight?: number;
  invalid?: boolean;
};

/**
 * Rich text editor (Tiptap): bold, italic, underline, headings, lists,
 * links, tables, quotes, clear formatting, undo/redo. Output is HTML; the
 * server sanitises it on save and again on render.
 */
export function RichTextEditor({ id, value, onChange, minHeight = 12, invalid }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: null, target: null } },
      }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        id,
        class: "prose-shop min-h-[var(--min-h)] px-3 py-2.5 focus:outline-none",
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
  });

  // Replace content when the value is changed from outside (e.g. a JSON import).
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML() && !(value === "" && editor.isEmpty)) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-white focus-within:border-brand focus-within:shadow-[0_0_0_3px_var(--color-brand-soft)]",
        invalid ? "border-sale" : "border-line-2",
      )}
      style={{ ["--min-h" as string]: `${minHeight}rem` }}
    >
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b border-line bg-muted" />}
      <div className="max-h-[32rem] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState("");
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      table: e.isActive("table"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();

  const applyLink = () => {
    const url = href.trim();
    if (!url) c().extendMarkRange("link").unsetLink().run();
    else c().extendMarkRange("link").setLink({ href: /^(https?:|mailto:|tel:|\/)/i.test(url) ? url : `https://${url}` }).run();
    setLinkOpen(false);
  };

  return (
    <div className="border-b border-line bg-muted">
      <div className="flex flex-wrap items-center gap-0.5 p-1" role="toolbar" aria-label="Formatting">
        <Btn label="Bold" active={s.bold} onClick={() => c().toggleBold().run()}>
          <b>B</b>
        </Btn>
        <Btn label="Italic" active={s.italic} onClick={() => c().toggleItalic().run()}>
          <i>I</i>
        </Btn>
        <Btn label="Underline" active={s.underline} onClick={() => c().toggleUnderline().run()}>
          <u>U</u>
        </Btn>
        <Sep />
        <Btn label="Heading" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}>
          H2
        </Btn>
        <Btn label="Subheading" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}>
          H3
        </Btn>
        <Sep />
        <Btn label="Bullet list" active={s.bullet} onClick={() => c().toggleBulletList().run()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>
        </Btn>
        <Btn label="Numbered list" active={s.ordered} onClick={() => c().toggleOrderedList().run()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M10 6h10M10 12h10M10 18h10M4 4v4M3 18h3l-3 2h3" /></svg>
        </Btn>
        <Btn label="Quote" active={s.quote} onClick={() => c().toggleBlockquote().run()}>
          <span className="text-lg leading-none">“</span>
        </Btn>
        <Btn
          label="Link"
          active={s.link || linkOpen}
          onClick={() => {
            setHref(editor.getAttributes("link").href ?? "");
            setLinkOpen((o) => !o);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
        </Btn>
        <Btn label="Insert table" active={s.table} onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 10h18M3 15h18M9 4v16M15 4v16" /></svg>
        </Btn>
        <Sep />
        <Btn label="Clear formatting" onClick={() => c().unsetAllMarks().clearNodes().run()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 5h12M12 5l-3 14M15 15l5 5M20 15l-5 5" /></svg>
        </Btn>
        <Btn label="Undo" disabled={!s.canUndo} onClick={() => c().undo().run()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
        </Btn>
        <Btn label="Redo" disabled={!s.canRedo} onClick={() => c().redo().run()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m15 14 5-5-5-5M20 9H9a5 5 0 0 0 0 10h3" /></svg>
        </Btn>
      </div>

      {linkOpen && (
        <div className="flex gap-2 border-t border-line p-2">
          <label htmlFor="rte-link" className="sr-only">
            Link address
          </label>
          <input
            id="rte-link"
            className="input h-9 min-h-9 text-sm"
            placeholder="https://example.com or /shop"
            value={href}
            autoFocus
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") setLinkOpen(false);
            }}
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={applyLink}>
            {href ? "Apply" : "Remove"}
          </button>
        </div>
      )}

      {s.table && (
        <div className="flex flex-wrap gap-1 border-t border-line p-1.5 text-sm">
          <TableBtn onClick={() => c().addRowAfter().run()}>Add row</TableBtn>
          <TableBtn onClick={() => c().addColumnAfter().run()}>Add column</TableBtn>
          <TableBtn onClick={() => c().deleteRow().run()}>Remove row</TableBtn>
          <TableBtn onClick={() => c().deleteColumn().run()}>Remove column</TableBtn>
          <TableBtn onClick={() => c().toggleHeaderRow().run()}>Header row</TableBtn>
          <TableBtn onClick={() => c().deleteTable().run()} danger>
            Delete table
          </TableBtn>
        </div>
      )}
    </div>
  );
}

function Btn({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-1.5 text-sm text-text-2 hover:bg-white hover:text-text disabled:opacity-40",
        active && "bg-white text-brand shadow-sm",
      )}
    >
      {children}
    </button>
  );
}

function TableBtn({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} className={cn("rounded-md px-2 py-1 hover:bg-white", danger ? "text-sale" : "text-text-2")}>
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-5 w-px bg-line-2" aria-hidden="true" />;
}
