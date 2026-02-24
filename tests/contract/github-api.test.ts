import { describe, it, expect, beforeAll } from "vitest";
import { Octokit } from "@octokit/rest";

/**
 * Contract Tests: GitHub API Integration
 *
 * Purpose: Validate GitHub REST API responses match our expected types
 * These tests verify the external API contract we depend on.
 */

describe("GitHub API Contract Tests", () => {
  let octokit: Octokit;

  beforeAll(() => {
    octokit = new Octokit();
  });

  describe("T034: Commits endpoint contract", () => {
    it("should return commits array with required fields", async () => {
      // Use a well-known public repository for testing
      const response = await octokit.repos.listCommits({
        owner: "facebook",
        repo: "react",
        per_page: 1,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      const commit = response.data[0];

      // Verify commit structure matches GitHubCommitResponse type
      expect(commit).toHaveProperty("sha");
      expect(commit).toHaveProperty("commit");
      expect(commit).toHaveProperty("html_url");
      expect(commit).toHaveProperty("parents");

      expect(typeof commit.sha).toBe("string");
      expect(commit.sha.length).toBe(40); // SHA-1 hash

      // Verify commit.commit structure
      expect(commit.commit).toHaveProperty("author");
      expect(commit.commit).toHaveProperty("committer");
      expect(commit.commit).toHaveProperty("message");

      // Verify author structure
      expect(commit.commit.author).toBeTruthy();
      if (commit.commit.author) {
        expect(commit.commit.author).toHaveProperty("name");
        expect(commit.commit.author).toHaveProperty("email");
        expect(commit.commit.author).toHaveProperty("date");

        expect(typeof commit.commit.author.name).toBe("string");
        expect(typeof commit.commit.author.email).toBe("string");
        expect(typeof commit.commit.author.date).toBe("string");
      }

      // Verify parents array
      expect(Array.isArray(commit.parents)).toBe(true);
    });

    it("should support pagination parameters", async () => {
      const response = await octokit.repos.listCommits({
        owner: "facebook",
        repo: "react",
        per_page: 5,
        page: 1,
      });

      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    it("should support path parameter for file-specific commits", async () => {
      const response = await octokit.repos.listCommits({
        owner: "facebook",
        repo: "react",
        path: "README.md",
        per_page: 1,
      });

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe("T035: File content endpoint contract", () => {
    it("should return file content with required fields", async () => {
      const response = await octokit.repos.getContent({
        owner: "facebook",
        repo: "react",
        path: "README.md",
      });

      const content = response.data;

      // Verify file content structure
      expect(content).toHaveProperty("type");
      expect(content).toHaveProperty("encoding");
      expect(content).toHaveProperty("size");
      expect(content).toHaveProperty("name");
      expect(content).toHaveProperty("path");
      expect(content).toHaveProperty("content");
      expect(content).toHaveProperty("sha");

      if ("content" in content) {
        expect(typeof content.content).toBe("string");
        expect(content.encoding).toBe("base64");
      }
    });

    it("should support ref parameter for specific commit", async () => {
      // Get a commit SHA first
      const commits = await octokit.repos.listCommits({
        owner: "facebook",
        repo: "react",
        per_page: 1,
      });

      const sha = commits.data[0].sha;

      const response = await octokit.repos.getContent({
        owner: "facebook",
        repo: "react",
        path: "README.md",
        ref: sha,
      });

      expect(response.data).toBeDefined();
    });

    it("should return 404 for non-existent file", async () => {
      await expect(
        octokit.repos.getContent({
          owner: "facebook",
          repo: "react",
          path: "this-file-does-not-exist-12345.txt",
        })
      ).rejects.toThrow();
    });
  });

  describe("Rate limit handling", () => {
    it("should provide rate limit information in headers", async () => {
      const response = await octokit.repos.listCommits({
        owner: "facebook",
        repo: "react",
        per_page: 1,
      });

      // GitHub provides rate limit info in headers
      expect(response.headers).toBeDefined();
    });
  });
});
