import migration from './clm-migration.json'
export type MapNode = { type: string; text?: string; content?: MapNode[]; attrs?: { level?: number; start?: number }; marks?: { type: string }[] }
export type MapSection = { id: string; title: string; position: number; content: MapNode; version: number; updated_at: string; journey?: string }
export type MapContribution = { id: string; section_id: string; author_id: string; body: string; kind: 'comment' | 'suggestion'; proposed_content: MapNode | null; base_version: number; status: 'open' | 'accepted' | 'rejected' | 'resolved'; created_at: string; review_note: string | null; reviewer_id: string | null }
export type MapRevision = { section_id: string; version: number; content: MapNode; editor_id: string | null; note: string; created_at: string }
export type MapWorkspace = { sections: MapSection[]; contributions: MapContribution[]; revisions: MapRevision[]; authors: { user_id: string; display_name: string }[]; isLead: boolean; userId: string }
export const MAP_PATH = '/community/tools/mapa-contratos'
export const LEGACY_MAP_SECTION_IDS = ['solicitacao','triagem','elaboracao','negociacao','aprovacao','assinatura','execucao','renovacao'] as const
export const MAP_SECTION_IDS: readonly string[] = [...LEGACY_MAP_SECTION_IDS, ...migration.stages.map(stage => stage.id)]
export const MIGRATION_PHASES = migration.phases
export const MIGRATION_STAGES = migration.stages
const children: Record<string, string[]> = {
  doc: ['paragraph','heading','bulletList','orderedList','blockquote'],
  paragraph: ['text','hardBreak'], heading: ['text','hardBreak'],
  bulletList: ['listItem'], orderedList: ['listItem'],
  listItem: ['paragraph','bulletList','orderedList'], blockquote: ['paragraph','heading','bulletList','orderedList'],
  text: [], hardBreak: [],
}
export function validMapContent(value: unknown): value is MapNode {
  let nodes = 0
  function valid(node: unknown, depth: number): node is MapNode {
    if (!node || typeof node !== 'object' || Array.isArray(node) || depth > 12 || ++nodes > 1500) return false
    const item = node as MapNode
    if (!Object.hasOwn(children, item.type) || (depth === 0) !== (item.type === 'doc')) return false
    if (Object.keys(item).some(key => !['type','text','content','attrs','marks'].includes(key))) return false
    if (item.type === 'text') { if (typeof item.text !== 'string' || !item.text.length || item.text.length > 20000) return false }
    else if (item.text !== undefined) return false
    if (item.attrs !== undefined) {
      if (!item.attrs || typeof item.attrs !== 'object' || Array.isArray(item.attrs)) return false
      if (item.type === 'heading') { if (Object.keys(item.attrs).some(key => key !== 'level') || ![2,3].includes(item.attrs.level!)) return false }
      else if (item.type === 'orderedList') { if (Object.keys(item.attrs).some(key => key !== 'start') || !Number.isInteger(item.attrs.start) || item.attrs.start! < 1 || item.attrs.start! > 10000) return false }
      else if (Object.keys(item.attrs).length) return false
    }
    if (item.type === 'heading' && !item.attrs?.level) return false
    if (item.marks !== undefined && (!Array.isArray(item.marks) || item.type !== 'text' || item.marks.length > 2 || item.marks.some(mark => !mark || Object.keys(mark).length !== 1 || !['bold','italic'].includes(mark.type)))) return false
    if (item.content !== undefined && (!Array.isArray(item.content) || item.content.length > 300 || item.content.some(child => !children[item.type].includes(child?.type) || !valid(child, depth + 1)))) return false
    return true
  }
  try { return JSON.stringify(value).length <= 60000 && valid(value, 0) && mapText(value).trim().length > 0 } catch { return false }
}
export function mapText(node: MapNode): string {
  return node.type === 'text' ? node.text ?? '' : (node.content ?? []).map(mapText).join(['paragraph','heading'].includes(node.type) ? '' : '\n')
}
