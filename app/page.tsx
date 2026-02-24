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
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Hero section */}
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex items-center justify-center">
            <div className="relative">
              <h1 className="text-5xl font-bold text-foreground tracking-tight">
                Pencil<span className="text-primary">History</span>
              </h1>
              <div
                className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl -z-10"
                aria-hidden="true"
              ></div>
            </div>
          </div>
          <p className="text-lg text-foreground-secondary font-medium">
            檢視 GitHub .pen 設計檔案的 commit 歷史
          </p>
          <p className="mt-2 text-sm text-foreground-tertiary">
            視覺化呈現每個版本的設計內容，如同 githistory.xyz
          </p>
        </div>

        {/* URL input form */}
        <div className="rounded-xl border border-border bg-surface p-8 shadow-lg backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <ErrorMessage message={error} title="URL 驗證失敗" onRetry={() => setError(null)} />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full font-semibold"
            >
              檢視歷史
            </Button>
          </form>

          {/* Help text */}
          <div className="mt-6 space-y-3 text-sm text-foreground-secondary border-t border-border pt-6">
            <p className="font-semibold text-foreground">支援格式：</p>
            <ul className="space-y-2 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-success mt-0.5">✓</span>
                <span>https://github.com/owner/repo/blob/main/path/to/file.pen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-0.5">✓</span>
                <span>僅支援 GitHub 公開儲存庫</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-0.5">✓</span>
                <span>檔案大小限制：10MB</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            title="Commit 時間軸"
            description="檢視完整的 commit 歷史和時間軸"
          />
          <FeatureCard
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            }
            title="視覺化設計"
            description="以圖像方式呈現每個版本的設計"
          />
          <FeatureCard
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
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
    <div className="group rounded-xl border border-border bg-surface p-6 text-center transition-all duration-200 hover:border-primary hover:shadow-md cursor-default">
      <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-primary-light p-3 text-primary transition-transform duration-200 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-foreground-secondary leading-relaxed">{description}</p>
    </div>
  );
}
