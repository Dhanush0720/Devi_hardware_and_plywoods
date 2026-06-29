import { NextResponse } from 'next/server';

export function middleware(req) {
  const token = req.cookies.get('admin_token')?.value;
  const url = req.nextUrl.clone();
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || 'change_this_to_a_long_random_string';

  // Protect HTML pages under /admin (except /admin/login)
  if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
    if (!token || token !== sessionSecret) {
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect API routes
  if (url.pathname.startsWith('/api/')) {
    const isLogin = url.pathname.startsWith('/api/admin/');
    const isWebhook = url.pathname === '/api/whatsapp/webhook';
    
    if (!isLogin && !isWebhook) {
      const isWrite = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
      
      let needsAuth = false;
      
      // Protect all inventory API calls
      if (url.pathname.startsWith('/api/inventory')) {
        needsAuth = true;
      }
      // Protect modifying products API calls
      else if (url.pathname.startsWith('/api/products') && isWrite) {
        needsAuth = true;
      }
      // Protect orders list API
      else if (url.pathname === '/api/orders' && req.method === 'GET') {
        needsAuth = true;
      }
      // Protect order status PATCH updates (e.g. /api/orders/[id])
      else if (url.pathname.startsWith('/api/orders/') && req.method === 'PATCH') {
        needsAuth = true;
      }

      if (needsAuth) {
        if (!token || token !== sessionSecret) {
          return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*']
};
