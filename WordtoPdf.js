import { PDFDocument, rgb } from 'pdf-lib';
import { extractRawText } from 'mammoth';

export async function wordToPdf(wordFile, options) {
    // Extract text from Word document
    const arrayBuffer = await readFileAsArrayBuffer(wordFile);
    const result = await extractRawText({ arrayBuffer });
    const text = result.value;
    
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { height } = page.getSize();
    
    // Add text to PDF
    const fontSize = options.quality === 'high' ? 12 : (options.quality === 'low' ? 10 : 11);
    page.drawText(text, {
        x: 50,
        y: height - 50,
        size: fontSize,
        color: rgb(0, 0, 0),
        lineHeight: fontSize * 1.2,
        maxWidth: 500,
    });
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    return {
        url,
        filename: `${wordFile.name.replace(/\.[^/.]+$/, '')}.pdf`
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
