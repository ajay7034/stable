"use client";
import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
function document(value: string) {
  try {
    const d = JSON.parse(value);
    if (d.type === "doc") return d;
  } catch {}
  return {
    type: "doc",
    content: value.split(/\n\s*\n/).map((text) => ({
      type: "paragraph",
      content: text ? [{ type: "text", text }] : [],
    })),
  };
}
export function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    content: document(value),
    onUpdate: ({ editor }) => onChange(JSON.stringify(editor.getJSON())),
    editorProps: {
      attributes: { "aria-label": "Rich text content", role: "textbox" },
    },
  });
  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== value) {
      const doc = document(value);
      if (JSON.stringify(doc) !== JSON.stringify(editor.getJSON()))
        editor.commands.setContent(doc, { emitUpdate: false });
    }
  }, [value, editor]);
  if (!editor) return <div>Loading editor…</div>;
  return (
    <div className="rich-editor">
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="Text formatting"
      >
        <button
          type="button"
          aria-label="Bold"
          aria-pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          aria-label="Italic"
          aria-pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          aria-label="Heading"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          aria-label="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </button>
        <button
          type="button"
          aria-label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          aria-label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </button>
        <button
          type="button"
          aria-label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo size={15} />
        </button>
        <button
          type="button"
          aria-label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo size={15} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
