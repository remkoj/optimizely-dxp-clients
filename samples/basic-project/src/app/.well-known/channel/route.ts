import { NextResponse } from "next/server";
import channel from "@/channel";

export function GET() {
  return NextResponse.json(channel)
}

export const dynamic = 'force-dynamic' // Make sure all API-Requests are executed
export const dynamicParams = true // Make sure all matching routes are always executed
export const revalidate = 0 // Don't cache
export const fetchCache = 'force-no-store' // Don't cache
export const runtime = 'nodejs' // Run on Node.JS

