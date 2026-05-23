// Cross-origin download via blob fetch.
// The HTML `download` attribute is silently ignored by browsers for cross-origin URLs.
// Fetching as a blob first creates a same-origin blob URL, making the download work.
// Requires CORS `Access-Control-Allow-Origin` on the resource server (R2 bucket).
export async function downloadFile(url, filename) {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
