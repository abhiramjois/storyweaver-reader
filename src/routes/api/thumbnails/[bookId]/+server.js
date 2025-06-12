import fs from 'fs';
import path from 'path';

const BOOKS_DIR = 'books';

export async function GET({ params }) {
  const { bookId } = params;
  
  // Construct the thumbnail path
  const thumbnailPath = path.join(BOOKS_DIR, bookId, 'thumbnail.png');
  
  // Check if the thumbnail exists
  if (!fs.existsSync(thumbnailPath)) {
    return new Response('Thumbnail not found', { status: 404 });
  }
  
  try {
    // Read the thumbnail file
    const thumbnailBuffer = fs.readFileSync(thumbnailPath);
    
    // Return the image with proper headers
    return new Response(thumbnailBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
      }
    });
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    return new Response('Error reading thumbnail', { status: 500 });
  }
}