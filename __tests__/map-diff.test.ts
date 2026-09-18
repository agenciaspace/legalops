import {describe,it,expect} from 'vitest'
import {mapChanges,mergeMapChanges,cleanMapMentions} from '@/lib/map-diff'
import {validMapContent,type MapNode} from '@/lib/contract-map'
const p=(text:string):MapNode=>({type:'paragraph',content:[{type:'text',text,marks:[{type:'bold'}]}]})
const doc=(...text:string[]):MapNode=>({type:'doc',content:text.map(p)})
describe('reviewed document content',()=>{
 it('accepts individual changed groups without losing unchanged blocks or formatting',()=>{const before=doc('A','keep','B'),after=doc('New A','keep','New B');expect(mapChanges(before,after).filter(c=>c.changed)).toHaveLength(2);expect(mergeMapChanges(before,after,[true,false])).toEqual(doc('New A','keep','B'))})
 it('supports additions and deletions',()=>{expect(mergeMapChanges(doc('A','B'),doc('A'),[true])).toEqual(doc('A'));expect(mergeMapChanges(doc('A'),doc('A','B'),[false])).toEqual(doc('A'))})
 it('requires exactly one decision per changed group',()=>{expect(()=>mergeMapChanges(doc('A'),doc('B'),[])).toThrow();expect(()=>mergeMapChanges(doc('A'),doc('B'),[true,false])).toThrow();expect(mergeMapChanges(doc('A'),doc('A'),[])).toEqual(doc('A'))})
 it('removes member identifiers before public publication',()=>{const result=cleanMapMentions({type:'doc',content:[{type:'paragraph',content:[{type:'mention',attrs:{id:'private-id',label:'Maria'} as any}]}]});expect(result).toEqual({type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'@Maria'}]}]});expect(validMapContent(result)).toBe(true)})
 it('accepts checklists and tables, rejects unsafe attributes',()=>{const content:MapNode={type:'doc',content:[{type:'taskList',content:[{type:'taskItem',attrs:{checked:true},content:[p('Done')]}]},{type:'table',content:[{type:'tableRow',content:[{type:'tableCell',attrs:{colspan:1,rowspan:1,colwidth:null},content:[p('Cell')]}]}]}]};expect(validMapContent(content)).toBe(true);expect(validMapContent({...content,content:[{type:'tableCell',attrs:{colspan:999,rowspan:1}}]})).toBe(false)})
})
it('normalizes real Tiptap table defaults before API validation',()=>{const cell={type:'tableCell',attrs:{colspan:1,rowspan:1,colwidth:null,align:null},content:[p('From editor')]};const result=cleanMapMentions({type:'doc',content:[{type:'table',content:[{type:'tableRow',content:[cell as MapNode]}]}]});expect(validMapContent(result)).toBe(true);expect(JSON.stringify(result)).not.toContain('align')})
