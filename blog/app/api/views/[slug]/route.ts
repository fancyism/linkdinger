import { NextRequest, NextResponse } from "next/server";
import { encodeViewCountKey, parseViewCount } from "@/lib/view-counts";

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

    const url =
      process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL ||
      process.env.UPSTASH_REDIS_REST_URL;
    const token =
      process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn("Upstash Redis credentials are not configured.");
      return NextResponse.json({ views: 0 }, { status: 200 });
    }

    const res = await fetch(`${url}/get/${encodeViewCountKey(slug)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("Failed to get views from Upstash", await res.text());
      return NextResponse.json({ views: 0 }, { status: 200 });
    }

    const data = await res.json();
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

    const url =
      process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL ||
      process.env.UPSTASH_REDIS_REST_URL;
    const token =
      process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn("Upstash Redis credentials are not configured.");
      return NextResponse.json({ views: 0 }, { status: 200 });
    }

    const res = await fetch(`${url}/incr/${encodeViewCountKey(slug)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: "POST",
    });

    if (!res.ok) {
      console.error("Failed to increment views in Upstash", await res.text());
      return NextResponse.json({ views: 0 }, { status: 200 });
    }

    const data = await res.json();
    const currentViews = parseViewCount(data.result);

    return NextResponse.json({ views: currentViews }, { status: 200 });
  } catch (error) {
    console.error("API Error: Failed to increment views", error);
    return NextResponse.json({ views: 0 }, { status: 200 });
  }
}
