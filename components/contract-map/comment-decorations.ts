import type { Node } from '@tiptap/pm/model'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { MapContribution, MapNode } from '@/lib/contract-map'
import { commentRanges, commentTextIndex, makeCommentSelection } from '@/lib/map-comments'

export function editorCommentSelection(doc: Node, from: number, to: number) {
  const index = commentTextIndex(doc.toJSON() as MapNode)
  const runs = index.runs.filter(run => run.pos < to && run.pos + run.size > from)
  if (!runs.length) return null
  const first = runs[0], last = runs[runs.length - 1]
  return makeCommentSelection(index.text, first.start + (first.size === first.end - first.start ? Math.max(0, from - first.pos) : 0), last.end - (last.size === last.end - last.start ? Math.max(0, last.pos + last.size - to) : 0), 'draft')
}

export function editorCommentDecorations(doc: Node, comments: MapContribution[], activeId?: string | null) {
  const content = doc.toJSON() as MapNode
  const { runs } = commentTextIndex(content)
  const decorations: Decoration[] = []
  for (const range of commentRanges(content, comments)) {
    for (const run of runs) {
      const start = Math.max(range.start, run.start), end = Math.min(range.end, run.end)
      if (start >= end) continue
      const from = run.pos + (run.size === run.end - run.start ? start - run.start : 0)
      const to = run.pos + (run.size === run.end - run.start ? end - run.start : run.size)
      decorations.push(Decoration.inline(from, to, { class: `map-comment-highlight ${range.id === activeId ? 'is-active' : ''}`, 'data-comment-id': range.id }))
    }
  }
  return DecorationSet.create(doc, decorations)
}
