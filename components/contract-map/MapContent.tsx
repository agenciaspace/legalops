import type { MapNode } from '@/lib/contract-map'
// Render a constrained tree as React text, never as untrusted HTML.
export function MapContent({ content }: { content: MapNode }) {
  function node(item: MapNode, key: number): React.ReactNode {
    const inner = item.content?.map(node)
    if (item.type === 'text') {
      let text: React.ReactNode = item.text
      if (item.marks?.some(mark => mark.type === 'bold')) text = <strong>{text}</strong>
      if (item.marks?.some(mark => mark.type === 'italic')) text = <em>{text}</em>
      return <span key={key}>{text}</span>
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
      case 'hardBreak': return <br key={key} />
      default: return null
    }
  }
  return <div className="contract-map-prose">{node(content, 0)}</div>
}
