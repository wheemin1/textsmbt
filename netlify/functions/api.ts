import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createServer } from '../../../server/index.js';

let app: any = null;

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Initialize Express app if not already done
  if (!app) {
    // Import and initialize your Express app
    const serverModule = await import('../../../server/index.js');
    app = serverModule.default || serverModule.app;
  }

  // Convert Netlify event to Express-compatible request
  const { httpMethod, path, queryStringParameters, headers, body } = event;
  
  // Create mock request and response objects
  const req = {
    method: httpMethod,
    url: path + (queryStringParameters ? '?' + new URLSearchParams(queryStringParameters).toString() : ''),
    headers: headers || {},
    body: body || '',
  };

  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    status: function(code: number) { this.statusCode = code; return this; },
    json: function(data: any) { this.body = JSON.stringify(data); return this; },
    send: function(data: any) { this.body = typeof data === 'string' ? data : JSON.stringify(data); return this; },
    setHeader: function(name: string, value: string) { this.headers[name] = value; return this; },
  };

  try {
    // Handle the request
    await new Promise((resolve, reject) => {
      app(req, res, (err: any) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    return {
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body,
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
