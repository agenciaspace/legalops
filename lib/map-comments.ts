import type { MapContribution, MapNode } from './contract-map'

export type CommentAnchor = { start: number; end: number; prefix: string; suffix: string; source: 'published' | 'draft' }
export type CommentSelection = { quote: string; anchor: CommentAnchor }
export type CommentRange = { id: string; start: number; end: number }
type TextRun = { path: string; start: number; end: number; pos: number; size: number }

// One projection for the reader, ProseMirror and persisted comment anchors.
// Paragraph separators are explicit; formatting never changes text offsets.
export function commentTextIndex(doc: MapNode) {
  let text = ''
  const runs: TextRun[] = []
  function visit(node: MapNode, path: string, pos: number): number {
    if (node.type === 'text' || node.type === 'mention' || node.type === 'hardBreak') {
      const value = node.type === 'text' ? node.text ?? '' : node.type === 'hardBreak' ? '\n' : `@${(node.attrs as { label?: string })?.label ?? ''}`
      const size = node.type === 'text' ? value.length : 1
      runs.push({ path, start: text.length, end: text.length + value.length, pos, size })
      text += value
      return size
    }
    let size = node.type === 'doc' ? 0 : 1
    node.content?.forEach((child, i) => { size += visit(child, `${path}.${i}`, pos + size) })
    if (node.type === 'paragraph' || node.type === 'heading') text += '\n'
    return size + (node.type === 'doc' ? 0 : 1)
  }
  visit(doc, '0', 0)
  return { text, runs }
}

export function makeCommentSelection(text: string, start: number, end: number, source: CommentAnchor['source']): CommentSelection | null {
  while (start < end && /\s/.test(text[start])) start++
  while (end > start && /\s/.test(text[end - 1])) end--
  end = Math.min(end, start + 1000)
  if (start >= end) return null
  return { quote: text.slice(start, end), anchor: { start, end, prefix: text.slice(Math.max(0, start - 64), start), suffix: text.slice(end, end + 64), source } }
}

export function validCommentAnchor(value: unknown): value is CommentAnchor {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const a = value as CommentAnchor
  return Object.keys(a).length === 5 && Number.isInteger(a.start) && Number.isInteger(a.end) && a.start >= 0 && a.end > a.start && a.end <= 60000 && a.end - a.start <= 1000 && typeof a.prefix === 'string' && a.prefix.length <= 64 && typeof a.suffix === 'string' && a.suffix.length <= 64 && ['published', 'draft'].includes(a.source)
}

export function locateComment(text: string, quote: string, anchor?: CommentAnchor | null): { start: number; end: number } | null {
  if (!quote) return null
  const matches: number[] = []
  for (let at = text.indexOf(quote); at !== -1; at = text.indexOf(quote, at + 1)) matches.push(at)
  if (matches.length === 1) return { start: matches[0], end: matches[0] + quote.length }
  if (!anchor || !matches.length) return null
  const contextual = matches.filter(start => (!anchor.prefix || text.slice(Math.max(0, start - anchor.prefix.length), start) === anchor.prefix) && (!anchor.suffix || text.slice(start + quote.length, start + quote.length + anchor.suffix.length) === anchor.suffix))
  // Never silently attach a comment to the first copy of repeated text.
  if (contextual.length !== 1) return null
  return { start: contextual[0], end: contextual[0] + quote.length }
}

export function commentRanges(content: MapNode, comments: MapContribution[]): CommentRange[] {
  const { text } = commentTextIndex(content)
  return comments.flatMap(item => {
    if (!item.anchor_quote || item.parent_id || item.status !== 'open') return []
    const range = locateComment(text, item.anchor_quote, item.anchor)
    return range ? [{ id: item.id, ...range }] : []
  })
}

export function commentThreads(items: MapContribution[]) {
  const comments = items.filter(item => item.kind === 'comment')
  const byId = new Map(comments.map(item => [item.id, item]))
  const groups = new Map<string, MapContribution[]>()
  for (const item of comments) {
    let root = item
    const seen = new Set([root.id])
    while (root.parent_id && byId.has(root.parent_id) && !seen.has(root.parent_id)) { root = byId.get(root.parent_id)!; seen.add(root.id) }
    const group = groups.get(root.id) ?? []
    group.push(item); groups.set(root.id, group)
  }
  return Array.from(groups.entries()).map(([id, entries]) => ({ root: byId.get(id)!, replies: entries.filter(item => item.id !== id).sort((a, b) => a.created_at.localeCompare(b.created_at)) })).sort((a, b) => a.root.created_at.localeCompare(b.root.created_at))
}
