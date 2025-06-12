import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const BOOKS_DIR = 'books';
const METADATA_FILE = path.join(BOOKS_DIR, 'metadata.yaml');

function cleanTitle(folderName) {
	return folderName
		.replace(/^\d+-/, '')
		.replace(/-/g, ' ')
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

export async function load({ params }) {
	const { id } = params;

	if (!fs.existsSync(BOOKS_DIR)) {
		return { status: 404 };
	}

	const bookPath = path.join(BOOKS_DIR, id);

	if (!fs.existsSync(bookPath)) {
		return { status: 404 };
	}

	// Load metadata
	let metadata = {};
	if (fs.existsSync(METADATA_FILE)) {
		try {
			const yamlContent = fs.readFileSync(METADATA_FILE, 'utf8');
			const allMetadata = yaml.load(yamlContent) || {};
			metadata = allMetadata[id] || {};
		} catch (error) {
			console.error('Error reading metadata:', error);
		}
	}

	// Get files in book directory
	const files = fs.readdirSync(bookPath);
	const pdfFile = files.find(file => file.endsWith('.pdf'));
	const thumbnailFile = files.find(file => file.toLowerCase() === 'thumbnail.png');
	const attributionFile = files.find(file => file.startsWith('StoryWeaverAttribution_'));

	// Read attribution content
	let attributionContent = '';
	if (attributionFile) {
		try {
			const attributionPath = path.join(bookPath, attributionFile);
			attributionContent = fs.readFileSync(attributionPath, 'utf8');
		} catch (error) {
			console.error('Error reading attribution file:', error);
		}
	}

	if (!pdfFile) {
		return { status: 404 };
	}

	// Add thumbnail path if it exists
	if (thumbnailFile) {
		metadata.thumbnailPath = `/api/books/${id}/${thumbnailFile}`;
	}

	return {
		book: {
			id,
			title: metadata.title || cleanTitle(id),
			epubPath: `/api/books/${id}/${pdfFile}`,
			metadata,
			attributionContent
		}
	};
}
