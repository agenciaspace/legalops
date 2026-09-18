import type { MapNode } from '@/lib/contract-map'
import { commentTextIndex, type CommentRange } from '@/lib/map-comments'
// Render a constrained tree as React text, never as untrusted HTML.
export function MapContent({ content, ranges = [], activeId, onActivate }: { content: MapNode; ranges?: CommentRange[]; activeId?: string | null; onActivate?: (id: string) => void }) {
  const runs = new Map(commentTextIndex(content).runs.map(run => [run.path, run]))
  function node(item: MapNode, key: string): React.ReactNode {
    const inner = item.content?.map((child, i) => node(child, `${key}.${i}`))
    if (item.type === 'text') {
      const run = runs.get(key)!
      const matching = ranges.filter(range => range.start < run.end && range.end > run.start)
      const cuts = Array.from(new Set([run.start, run.end, ...matching.flatMap(range => [Math.max(run.start, range.start), Math.min(run.end, range.end)])])).sort((a, b) => a - b)
      let text: React.ReactNode = cuts.slice(0, -1).map((start, i) => {
        const end = cuts[i + 1]
        const covering = matching.filter(range => range.start < end && range.end > start)
        const chosen = covering.find(range => range.id === activeId) ?? covering[0]
        const value = item.text?.slice(start - run.start, end - run.start)
        return chosen ? <mark key={start} role="button" tabIndex={0} aria-label="Abrir comentário deste trecho" aria-pressed={chosen.id === activeId} data-comment-id={chosen.id} className={`map-comment-highlight ${chosen.id === activeId ? 'is-active' : ''}`} onClick={() => onActivate?.(chosen.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onActivate?.(chosen.id) } }}>{value}</mark> : <span key={start}>{value}</span>
      })
      if (item.marks?.some(mark => mark.type === 'bold')) text = <strong>{text}</strong>
      if (item.marks?.some(mark => mark.type === 'italic')) text = <em>{text}</em>
      return <span key={key} data-map-text-start={run.start}>{text}</span>
    }
    switch (item.type) {
      case 'doc': return <div key={key}>{inner}</div>
      case 'paragraph': return <p key={key}>{inner}</p>
      case 'heading': return item.attrs?.level === 3 ? <h3 key={key}>{inner}</h3> : <h2 key={key}>{inner}</h2>
      case 'bulletList': return <ul key={key}>{inner}</ul>
      case 'orderedList': return <ol key={key} start={item.attrs?.start}>{inner}</ol>
      case 'taskList': return <ul key={key} className="map-task-list">{inner}</ul>
      case 'taskItem': return <li key={key} className="map-task-item"><span aria-label={item.attrs?.checked ? 'Concluído' : 'Pendente'}>{item.attrs?.checked ? '☑' : '☐'}</span><div>{inner}</div></li>
      case 'table': return <div key={key} className="map-table-wrap"><table><tbody>{inner}</tbody></table></div>
      case 'tableRow': return <tr key={key}>{inner}</tr>
      case 'tableCell': return <td key={key} colSpan={item.attrs?.colspan} rowSpan={item.attrs?.rowspan}>{inner}</td>
      case 'tableHeader': return <th key={key} colSpan={item.attrs?.colspan} rowSpan={item.attrs?.rowspan}>{inner}</th>
      case 'listItem': return <li key={key}>{inner}</li>
      case 'blockquote': return <blockquote key={key}>{inner}</blockquote>
      case 'hardBreak': return <br key={key} data-map-text-start={runs.get(key)?.start} />
      default: return null
    }
  }
  return <div className="contract-map-prose">{node(content, '0')}</div>
}
