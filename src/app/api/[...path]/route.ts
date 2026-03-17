import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://127.0.0.1:8000";

async function proxy(request: NextRequest, params: { path: string[] }) {
  const path = params.path.join("/");
  const targetUrl = new URL(`${BACKEND_BASE}/api/${path}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const contentType = request.headers.get("content-type");
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const bodyBuffer = hasBody ? await request.arrayBuffer() : undefined;
  const body = bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined;

  const outboundHeaders = new Headers();
  const accept = request.headers.get("accept");
  if (accept) outboundHeaders.set("accept", accept);
  if (contentType) outboundHeaders.set("content-type", contentType);

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers: outboundHeaders,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const passthroughHeaders = ["content-type", "content-disposition", "cache-control", "pragma", "expires"];
  passthroughHeaders.forEach((headerName) => {
    const value = upstream.headers.get(headerName);
    if (value) responseHeaders.set(headerName, value);
  });

  const data = await upstream.arrayBuffer();

  return new NextResponse(data, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await context.params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await context.params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await context.params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await context.params);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await context.params);
}
