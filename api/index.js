export default async (req, res) => {
  try {
    const { default: workerHandler } = await import('../dist/server/index.js');

    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    
    // Read body for POST requests
    let body = undefined;
    if (!['GET', 'HEAD'].includes(req.method)) {
      body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
    }

    const fetchRequest = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: body?.length ? body : undefined,
    });

    const response = await workerHandler.fetch(fetchRequest, {}, {});
    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    const arrayBuffer = await response.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Handler error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message }));
  }
};
