import type { MapNode } from './contract-map'
export type MapChange = { before: MapNode[]; after: MapNode[]; changed: boolean }
// Compare semantic document blocks, preserving their rich-text JSON on either decision.
export function mapChanges(before: MapNode, after: MapNode): MapChange[] {
  const a = before.content ?? [], b = after.content ?? []
  const same = (i: number, j: number) => JSON.stringify(a[i]) === JSON.stringify(b[j])
  const lengths = Array.from({ length: a.length+1 }, () => new Uint16Array(b.length+1))
  for (let i=a.length-1;i>=0;i--) for (let j=b.length-1;j>=0;j--) lengths[i][j] = same(i,j) ? lengths[i+1][j+1]+1 : Math.max(lengths[i+1][j],lengths[i][j+1])
  const result: MapChange[] = []
  let i=0,j=0
  while(i<a.length || j<b.length) {
    if (i<a.length && j<b.length && same(i,j)) { result.push({before:[a[i++]],after:[b[j++]],changed:false}); continue }
    const part: MapChange = {before:[],after:[],changed:true}
    while(i<a.length || j<b.length) {
      if (i<a.length && j<b.length && same(i,j)) break
      if (i<a.length && (j===b.length || lengths[i+1][j]>=lengths[i][j+1])) part.before.push(a[i++]); else part.after.push(b[j++])
    }
    result.push(part)
  }
  return result
}
export function mergeMapChanges(before: MapNode, after: MapNode, decisions: boolean[]): MapNode {
  const changes = mapChanges(before,after)
  if (changes.filter(item => item.changed).length !== decisions.length || decisions.some(choice => typeof choice !== 'boolean')) throw new Error('Decida todas as alterações.')
  let index=0
  return {type:'doc',content:changes.flatMap(change => change.changed ? decisions[index++] ? change.after : change.before : change.before)}
}
export function cleanMapMentions(node: MapNode): MapNode {
  if (node.type === 'mention') return {type:'text',text:`@${String((node.attrs as Record<string,unknown>)?.label ?? 'membro')}`}
  // Tiptap adds an unused alignment default to table cells; keep the public schema narrow.
  const normalized = ['tableCell','tableHeader'].includes(node.type) ? {...node,attrs:Object.fromEntries(Object.entries(node.attrs??{}).filter(([key])=>key!=='align'))} : node
  return {...normalized, ...(node.content ? {content:node.content.map(cleanMapMentions)} : {})}

}
