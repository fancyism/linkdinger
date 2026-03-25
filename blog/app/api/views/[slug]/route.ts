import { NextRequest, NextResponse } from "next/server";
import { encodeViewCountKey, parseViewCount } from "@/lib/view-counts";
import { fetchUpstashJson, getUpstashRestConfig } from "@/lib/upstash";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const { url, token } = getUpstashRestConfig();

    if (!url || !token) {
      console.warn("Upstash Redis credentials are not configured.");
      return NextResponse.json({ views: 0 }, { status: 200 });
    }

    const data = await fetchUpstashJson<{ result: unknown }>(
      `/get/${encodeViewCountKey(slug)}`,
      { revalidate: 0 },
    );

    if (!data) {
      console.error("Failed to get views from Upstash");
      return NextResponse.json({ views: 0 }, { status: 200 });
    }

    const currentViews = parseViewCount(data.result);

    return NextResponse.json({ views: currentViews }, { status: 200 });
  } catch (error) {
    console.error("API Error: Failed to get views", error);
    return NextResponse.json({ views: 0 }, { status: 200 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const { url, token } = getUpstashRestConfig();

    if (!url || !token) {
      console.warn("Upstash Redis credentials are not configured.");
      return NextResponse.json({ views: 0 }, { status: 200 });
    }

    const data = await fetchUpstashJson<{ result: unknown }>(
      `/incr/${encodeViewCountKey(slug)}`,
      { method: "POST" },
    );

    if (!data) {
      console.error("Failed to increment views in Upstash");
      return NextResponse.json({ views: 0 }, { status: 200 });
    }

    const currentViews = parseViewCount(data.result);

    return NextResponse.json({ views: currentViews }, { status: 200 });
  } catch (error) {
    console.error("API Error: Failed to increment views", error);
    return NextResponse.json({ views: 0 }, { status: 200 });
  }
}
