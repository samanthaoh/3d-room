export const MAX_REFERENCE_LENGTH = 1500000;
export function isReferenceImage(value) {
  return value === null || (typeof value === 'string' && value.length <= MAX_REFERENCE_LENGTH && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(value));
}

// Store a compact local copy so saved rooms can retain their visual reference.
export async function prepareReferenceImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image preview is unavailable.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = canvas.toDataURL('image/png');
    if (png.length <= MAX_REFERENCE_LENGTH) return png;
    for (const quality of [0.85, 0.65, 0.45]) {
      const jpeg = canvas.toDataURL('image/jpeg', quality);
      if (jpeg.length <= MAX_REFERENCE_LENGTH) return jpeg;
    }
    throw new Error('This image is too detailed to save as a reference. Try a smaller image.');
  } catch (error) {
    if (error.name === 'EncodingError') throw new Error('This image could not be read. Try another JPG or PNG.');
    throw error;
  } finally {
    URL.revokeObjectURL(url);
  }
}
