// @vitest-environment node
import {expect,it} from 'vitest'
import {zipSync,strToU8} from 'fflate'
import {extractDocument} from '@/lib/chat/documents'

function fixturePdf(){
 const stream='BT /F1 12 Tf 72 720 Td (Sample contract: renewal requires written agreement between the parties.) Tj ET'
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`]
 let pdf='%PDF-1.4\n';const offsets=[0]
 objects.forEach((object,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${object}\nendobj\n`})
 const xref=pdf.length;pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
 return new File([pdf],'fixture.pdf',{type:'application/pdf'})
}
it('extracts and fingerprints UTF-8 files without truncating them',async()=>{
 const text='Modelo interno. A renovação depende de acordo escrito entre as partes.'
 const result=await extractDocument(new File([text],'modelo.txt'))
 expect(result.text).toBe(text);expect(result.hash).toHaveLength(64)
 expect((await extractDocument(new File([text],'modelo.md'))).hash).toBe(result.hash)
})
it('extracts a real PDF text stream',async()=>{
 expect((await extractDocument(fixturePdf())).text).toContain('renewal requires written agreement')
})
it('extracts DOCX paragraphs and rejects a compressed oversized document',async()=>{
 const archive=zipSync({'word/document.xml':strToU8('<w:document><w:p><w:r><w:t>Contract renewal requires written agreement between the parties.</w:t></w:r></w:p></w:document>')})
 expect((await extractDocument(new File([archive],'fixture.docx'))).text).toContain('Contract renewal requires written agreement')
 const oversized=zipSync({'word/document.xml':strToU8('x'.repeat(2*1024*1024+1))})
 await expect(extractDocument(new File([oversized],'oversized.docx'))).rejects.toThrow('muito extenso')
})
it('rejects unsupported, empty, binary and oversized text inputs',async()=>{
 await expect(extractDocument(new File(['a'.repeat(50)],'file.exe'))).rejects.toThrow('Use PDF')
 await expect(extractDocument(new File(['short'],'file.txt'))).rejects.toThrow('texto suficiente')
 await expect(extractDocument(new File(['\u0000'.repeat(50)],'file.txt'))).rejects.toThrow('UTF-8')
 await expect(extractDocument(new File(['x'.repeat(120001)],'file.txt'))).rejects.toThrow('120 mil')
})
