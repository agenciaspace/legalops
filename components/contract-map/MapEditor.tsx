'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { MapNode } from '@/lib/contract-map'
export function MapEditor({ content, onChange }: { content: MapNode; onChange: (value: MapNode) => void }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false, horizontalRule: false, strike: false, link: false, underline: false, orderedList: false })],
    content, immediatelyRender: false,
    editorProps: { attributes: { class: 'contract-map-prose min-h-64 p-4 outline-none', 'aria-label': 'Texto da proposta', role: 'textbox', 'aria-multiline': 'true' } },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as MapNode),
  })
  if (!editor) return <p className="p-4 text-sm">Carregando editor…</p>
  return <div className="overflow-hidden rounded-xl border border-[#CEC8BD] bg-white">
    <div role="toolbar" aria-label="Formatar texto" className="flex flex-wrap gap-1 border-b border-[#CEC8BD] bg-[#FAF7F1] p-2">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className="map-format font-bold">Negrito</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className="map-format italic">Itálico</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="map-format">Subtítulo</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className="map-format">Lista</button>
      <button type="button" onClick={() => editor.chain().focus().undo().run()} className="map-format">Desfazer</button>
    </div>
    <EditorContent editor={editor} />
  </div>
}
