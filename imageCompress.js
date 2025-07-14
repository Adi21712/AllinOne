import imageCompression from 'browser-image-compression';

export async function compressImage(imageFiles, options) {
    const results = [];
    
    for (const imageFile of imageFiles) {
        try {
            const result = await compressSingleImage(imageFile, options);
            results.push(result);
        } catch (error) {
            console.error('Error compressing image:', error);
            // Fall back to original file if compression fails
            results.push({
                url: URL.createObjectURL(imageFile),
                filename: imageFile.name
            });
        }
    }
    
    return results;
}

async function compressSingleImage(imageFile, options) {
    // Determine output type
    let outputType = options.format === 'original' ? imageFile.type : `image/${options.format}`;
    if (outputType === 'image/jpg') outputType = 'image/jpeg';
    
    // Compression options
    const compressionOptions = {
        maxSizeMB: options.quality * 2, // Adjust based on quality
        maxWidthOrHeight: options.quality === 0.3 ? 1024 : (options.quality === 0.5 ? 1536 : 2048),
        useWebWorker: true,
        fileType: outputType,
        initialQuality: options.quality
    };
    
    // Compress image
    const compressedFile = await imageCompression(imageFile, compressionOptions);
    
    // Create object URL
    const url = URL.createObjectURL(compressedFile);
    
    // Generate filename
    let extension = options.format === 'original' ? 
        imageFile.name.split('.').pop() : 
        options.format;
    if (extension === 'jpg') extension = 'jpeg';
    
    const filename = `${imageFile.name.replace(/\.[^/.]+$/, '')}_compressed.${extension}`;
    
    return {
        url,
        filename
    };
}
