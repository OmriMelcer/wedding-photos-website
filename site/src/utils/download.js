// Routes download through the Worker proxy (/api/download) so the browser
// receives a same-origin response with Content-Disposition: attachment.
// Direct cross-origin fetch of R2 URLs fails because the download attribute
// is ignored for cross-origin URLs and fetch() is blocked by CORS.
export async function downloadFile(url, filename) {
  const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('[download] proxy failed, falling back to new tab:', err, url);
    window.open(url, '_blank');
  }
}
