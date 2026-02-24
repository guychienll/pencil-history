// T059: Homepage with URL input form

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { parseGitHubURL } from "@/lib/github/parser";
import { ErrorMessage } from "@/components/layout/ErrorMessage";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Parse and validate GitHub URL
      const { owner, repo, branch, path } = parseGitHubURL(url);

      // Navigate to history viewer
      router.push(`/history/${owner}/${repo}/${branch}/${path}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "無效的 URL";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const exampleUrl = "https://github.com/owner/repo/blob/main/designs/example.pen";

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Hero section */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            PencilHistory.xyz
          </h1>
          <p className="text-lg text-gray-600">
            檢視 GitHub .pen 設計檔案的 commit 歷史
          </p>
          <p className="mt-2 text-sm text-gray-500">
            視覺化呈現每個版本的設計內容，如同 githistory.xyz
          </p>
        </div>

        {/* URL input form */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="GitHub .pen 檔案 URL"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={exampleUrl}
              fullWidth
              required
            />

            {error && (
              <ErrorMessage
                message={error}
                title="URL 驗證失敗"
                onRetry={() => setError(null)}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              檢視歷史
            </Button>
          </form>

          {/* Help text */}
          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <p className="font-medium">支援格式：</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>https://github.com/owner/repo/blob/main/path/to/file.pen</li>
              <li>僅支援 GitHub 公開儲存庫</li>
              <li>檔案大小限制：10MB</li>
            </ul>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            title="Commit 時間軸"
            description="檢視完整的 commit 歷史和時間軸"
          />
          <FeatureCard
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            }
            title="視覺化設計"
            description="以圖像方式呈現每個版本的設計"
          />
          <FeatureCard
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
            title="快速載入"
            description="智慧快取，快速切換不同版本"
          />
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <div className="mb-2 inline-flex items-center justify-center rounded-lg bg-blue-100 p-2 text-blue-600">
        {icon}
      </div>
      <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
