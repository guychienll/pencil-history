// Server-side GitHub API endpoint for fetching commits
// This endpoint uses server-side authentication to avoid rate limits

import { NextRequest, NextResponse } from "next/server";
import { fetchCommits } from "@/lib/github/commits";
import { getGitHubClient } from "@/lib/github/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const path = searchParams.get("path");
    const branch = searchParams.get("branch") || "main";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "100", 10);

    // Validate required parameters
    if (!owner || !repo || !path) {
      return NextResponse.json(
        { error: "Missing required parameters: owner, repo, path" },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    if (page < 1 || perPage < 1 || perPage > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Use server-side GitHub token if available
    const token = process.env.GITHUB_TOKEN;

    // Get rate limit info for debugging
    if (token) {
      const client = getGitHubClient(token);
      const rateLimit = await client.checkRateLimit();
      console.log(`GitHub API Rate Limit: ${rateLimit.remaining}/${rateLimit.limit}`);

      if (rateLimit.remaining < 10) {
        console.warn(`Warning: Approaching GitHub API rate limit. Reset at ${rateLimit.reset}`);
      }
    }

    // Fetch commits using the server-side token
    const commits = await fetchCommits(
      {
        owner,
        repo,
        path,
        sha: branch,
        page,
        perPage,
      },
      token
    );

    return NextResponse.json({
      commits,
      hasMore: commits.length === perPage,
      page,
      perPage,
    });
  } catch (error) {
    console.error("Error fetching commits:", error);

    if (error instanceof Error) {
      // Handle rate limit errors
      if (error.message.includes("rate limit") || error.message.includes("呼叫次數已達上限")) {
        return NextResponse.json(
          {
            error: error.message,
            retryAfter: 3600, // Default to 1 hour
          },
          { status: 429 }
        );
      }

      // Handle other errors
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
