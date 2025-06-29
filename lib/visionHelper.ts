import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export default client;

// Helper function to extract text from an image file
export async function extractTextFromImage(file: File): Promise<string> {
  try {
    // Convert file to base64
    const base64Image = await fileToBase64(file);
    
    // Remove the data URL prefix to get just the base64 string
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Create the request object for Vision API
    const request = {
      image: {
        content: base64Data
      }
    };
    
    const [result] = await client.textDetection(request);
    const detections = result.textAnnotations;
    return detections?.[0]?.description || '';
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Legacy function for file paths (keeping for backward compatibility)
export async function extractTextFromImagePath(imagePath: string) {
  const [result] = await client.textDetection(imagePath);
  const detections = result.textAnnotations;
  return detections?.[0]?.description || '';
} 