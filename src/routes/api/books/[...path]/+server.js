import fs from 'fs';
import path from 'path';

const BOOKS_DIR = 'books';

export async function GET({ params }) {
	const filePath = params.path;
	
	// Security: ensure the path doesn't go outside books directory
	const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
	const fullPath = path.join(process.cwd(), BOOKS_DIR, safePath);
	
	// Additional security check
	const booksRoot = path.join(process.cwd(), BOOKS_DIR);
	if (!fullPath.startsWith(booksRoot)) {
		return new Response('Forbidden', { status: 403 });
	}
	
	if (!fs.existsSync(fullPath)) {
		return new Response('Not Found', { status: 404 });
	}
	
	const stat = fs.statSync(fullPath);
	
	if (stat.isDirectory()) {
		return new Response('Forbidden', { status: 403 });
	}
	
	try {
		const file = fs.readFileSync(fullPath);
		const ext = path.extname(fullPath).toLowerCase();
		
		let contentType = 'application/octet-stream';
		if (ext === '.epub') {
			contentType = 'application/epub+zip';
		} else if (ext === '.txt') {
			contentType = 'text/plain; charset=utf-8';
		} else if (ext === '.html') {
			contentType = 'text/html; charset=utf-8';
		} else if (ext === '.css') {
			contentType = 'text/css';
		} else if (ext === '.js') {
			contentType = 'application/javascript';
		}
		
		return new Response(file, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': stat.size.toString(),
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (error) {
		console.error('Error reading file:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}