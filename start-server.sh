#!/bin/sh
# Start script for production server

echo "Starting Healthcare Alert System..."
echo "Port: ${PORT:-3000}"

# Create a Bun server script
cat > server.ts << 'EOF'
const port = process.env.PORT || 3000;

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // API health check
    if (pathname === '/api/health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Serve client assets (fonts, images, etc)
    if (pathname.startsWith('/assets/')) {
      const file = Bun.file(`./dist/client${pathname}`);
      if (await file.exists()) {
        return new Response(file);
      }
    }

    // Serve _expo static files (CSS, JS)
    if (pathname.startsWith('/_expo/')) {
      const file = Bun.file(`./dist/client${pathname}`);
      if (await file.exists()) {
        return new Response(file);
      }
    }

    // Try to serve from server directory
    let file = Bun.file(`./dist/server${pathname}`);
    if (await file.exists()) {
      return new Response(file);
    }

    // For routes, serve index.html
    if (!pathname.includes('.')) {
      file = Bun.file('./dist/server/index.html');
      if (await file.exists()) {
        return new Response(file, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    }

    // 404 for everything else
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Healthcare Alert System ready on http://localhost:${port}`);
EOF

# Run the server with Bun
exec bun server.ts