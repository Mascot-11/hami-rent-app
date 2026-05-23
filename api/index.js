import { default as workerHandler } from '../dist/server/index.js';

export default async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const fetchRequest = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
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
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
};
