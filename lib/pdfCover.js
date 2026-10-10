// Lê o PDF no browser e devolve a capa nativa (1ª página), nº de páginas e metadados.
export async function extractPdfInfo(file) {
  const pdfjs = await import('pdfjs-dist/build/pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await pdf.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: 600 / base.width });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  const cover = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));

  let info = {};
  try { info = (await pdf.getMetadata()).info || {}; } catch {}
  return { cover, pages: pdf.numPages, title: info.Title || '', author: info.Author || '' };
}
