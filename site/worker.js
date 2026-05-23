// Only allow proxying images from our own R2 bucket.
const R2_ORIGIN = 'https://pub-db0e5eba70a74d8cbe49b014f6329b9e.r2.dev';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/download') {
      const photoUrl = url.searchParams.get('url');
      const filename = url.searchParams.get('filename');

      if (!photoUrl || !photoUrl.startsWith(R2_ORIGIN + '/')) {
        return new Response('Forbidden', { status: 403 });
      }

      // Sanitize filename to prevent Content-Disposition header injection.
      const safeFilename = (filename || 'photo.jpg').replace(/[^\w.\-]/g, '_');

      const upstream = await fetch(photoUrl);
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'Content-Type': upstream.headers.get('Content-Type') || 'image/jpeg',
          'Content-Disposition': `attachment; filename="${safeFilename}"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
