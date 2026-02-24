// Server-side API route for fetching GitHub file content
// This protects the GitHub token and centralizes rate limiting

import { NextRequest, NextResponse } from "next/server";
import { fetchPenFileVersion } from "@/lib/github/files";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const path = searchParams.get("path");
    const sha = searchParams.get("sha");

    // Validate required parameters
    if (!owner || !repo || !path || !sha) {
      return NextResponse.json({ error: "缺少必要參數: owner, repo, path, sha" }, { status: 400 });
    }

    // Fetch file from GitHub via server-side
    const fileVersion = await fetchPenFileVersion({
      owner,
      repo,
      path,
      sha,
    });

    return NextResponse.json(fileVersion);
  } catch (error) {
    console.error("Server-side GitHub API error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
