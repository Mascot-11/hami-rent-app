import { default as workerHandler } from '../dist/server/index.js';

// Adapter to convert Cloudflare Worker handler to Node.js/Express-compatible function
export default async (req, res) => {
  try {
    // Convert Node.js request to Fetch API Request
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    
    const fetchRequest = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
    });

    // Call the Cloudflare worker handler
    const response = await workerHandler.fetch(fetchRequest, {}, {});

    // Convert Fetch API Response to Node.js response
    res.statusCode = response.status;
    
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    const arrayBuffer = await response.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Handler error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
};
