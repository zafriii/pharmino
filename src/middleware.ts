import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const url = request.nextUrl.clone();

  // Existing redirects
  if (
    pathname === '/admin' ||
    pathname === '/admin/hr' ||
    pathname === '/admin/hr/directory/employee'
  ) {
    url.pathname = '/admin/hr/directory';
    return NextResponse.redirect(url);
  }

  // New redirects
  if (pathname === '/admin/product-management') {
    url.pathname = '/admin/product-management/products';
    return NextResponse.redirect(url);
  }

  if (pathname === '/admin/purchase') {
    url.pathname = '/admin/purchase/purchase-list';
    return NextResponse.redirect(url);
  }

  if (pathname === '/admin/purchase/purchase-history') {
    url.pathname = '/admin/purchase/purchase-history/ordered-items';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/hr',
    '/admin/hr/directory/employee',
    '/admin/product-management',
    '/admin/purchase',
    '/admin/purchase/purchase-history',
  ],
};
