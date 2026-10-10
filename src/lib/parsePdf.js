import { getAllPagesText } from "./pdfjs.js";

// Pull the full text out of a PDF File, entirely in the browser.
export async function extractPdfText(file) {
  const data = await file.arrayBuffer();
  return getAllPagesText(data);
}
