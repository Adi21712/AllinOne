import { PDFDocument } from 'pdf-lib';
import { Packer } from 'docx';
import { Document, Paragraph, TextRun } from 'docx';

export async function pdfToWord(pdfFile, options) {
    // Load PDF document
    const pdfBytes = await readFileAsArrayBuffer(pdfFile);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Extract text from each page
    const paragraphs = [];
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');
        
        paragraphs.push(
            new Paragraph({
                children: [new TextRun(text)],
                spacing: { after: 200 }
            })
        );
    }
    
    // Create Word document
    const doc = new Document({
        sections: [{
            properties: {},
            children: paragraphs
        }]
    });
    
    // Generate Word file
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    
    return {
        url,
        filename: `${pdfFile.name.replace('.pdf', '')}.${options.format || 'docx'}`
    };
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
