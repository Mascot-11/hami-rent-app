// Vercel Node.js serverless function adapter for TanStack Start
// This wraps the built server handler using the Web Fetch API bridge pattern.
// The build must target 'node' preset (see vercel.json buildCommand).

export default async (req, res) => {
  try {
    const { default: handler } = await import('../dist/server/index.mjs');

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const url = new URL(req.url || '/', `${protocol}://${host}`);

    // Read body for non-GET/HEAD requests
    let body = undefined;
    if (!['GET', 'HEAD'].includes(req.method?.toUpperCase())) {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      if (chunks.length > 0) {
        body = Buffer.concat(chunks);
      }
    }

    // Build Web-standard Request
    const fetchRequest = new Request(url.toString(), {
      method: req.method,
      headers: Object.fromEntries(
        Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v])
      ),
      body: body?.length ? body : undefined,
      duplex: body?.length ? 'half' : undefined,
    });

    // Call the TanStack Start server handler
    // In node preset the export is { default: { fetch } } or directly a fetch function
    const fetchFn =
      typeof handler === 'function'
        ? handler
        : typeof handler?.fetch === 'function'
        ? handler.fetch.bind(handler)
        : null;

    if (!fetchFn) {
      throw new Error(`Unexpected server export shape: ${Object.keys(handler ?? {}).join(', ')}`);
    }

    const response = await fetchFn(fetchRequest);

    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
      // Skip hop-by-hop headers that cause issues
      if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    console.error('[api/index.js] Handler error:', error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: error.message }));
  }
};
