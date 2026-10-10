import * as pdfjsLib from "pdfjs-dist";

// Vite-friendly way to load the worker: an ESM import Vite bundles and serves
// with the correct URL, no CDN needed.
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

// Convert an ArrayBuffer of PDF bytes into the document's full text.
export async function getAllPagesText(data) {
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const chunks = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    chunks.push(content.items.map((item) => item.str).join(" "));
  }
  return chunks.join(" ");
}
