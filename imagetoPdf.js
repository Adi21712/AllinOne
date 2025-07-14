import { PDFDocument, rgb } from 'pdf-lib';

export async function imageToPdf(imageFiles, options) {
    const pdfDoc = await PDFDocument.create();
    
    // Process each image
    for (const imageFile of imageFiles) {
        // Add a new page for each image unless combining
        if (!options.combine || pdfDoc.getPageCount() === 0) {
            await addImageToPdf(pdfDoc, imageFile, options);
        }
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    return {
        url,
        filename: options.combine ? 'images.pdf' : `${imageFiles[0].name.replace(/\.[^/.]+$/, '')}.pdf`
    };
}

async function addImageToPdf(pdfDoc, imageFile, options) {
    const imageBytes = await readFileAsArrayBuffer(imageFile);
    let image;
    
    try {
        // Try to embed the image
        if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
            image = await pdfDoc.embedJpg(imageBytes);
        } else if (imageFile.type === 'image/png') {
            image = await pdfDoc.embedPng(imageBytes);
        } else {
            throw new Error('Unsupported image format');
        }
    } catch (error) {
        console.error('Error embedding image:', error);
        throw new Error('Could not process the image file');
    }
    
    // Determine page size based on options
    let pageWidth, pageHeight;
    switch (options.pageSize) {
        case 'a4':
            pageWidth = 595;
            pageHeight = 842;
            break;
        case 'letter':
            pageWidth = 612;
            pageHeight = 792;
            break;
        case 'a5':
            pageWidth = 420;
            pageHeight = 595;
            break;
        case 'auto':
        default:
            // Use image dimensions (1pt = 1/72 inch)
            pageWidth = image.width;
            pageHeight = image.height;
            break;
    }
    
    // Handle orientation
    if (options.orientation === 'landscape' && options.pageSize !== 'auto') {
        [pageWidth, pageHeight] = [pageHeight, pageWidth];
    } else if (options.orientation === 'auto' && image.width > image.height && options.pageSize !== 'auto') {
        [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }
    
    // Add page and draw image
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Scale image to fit page while maintaining aspect ratio
    const scale = Math.min(
        pageWidth / image.width,
        pageHeight / image.height
    );
    
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    
    // Center image on page
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;
    
    page.drawImage(image, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
    });
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
