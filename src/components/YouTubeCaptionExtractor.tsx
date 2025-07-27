'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FeatureCard } from '@/features/landing/FeatureCard';

export const YouTubeCaptionExtractor = () => {
  const [url, setUrl] = useState('');
  const [captions, setCaptions] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [stats, setStats] = useState<{
    wordCount: number;
    videoId: string;
    totalCaptions: number;
  } | null>(null);

  const handleExtractCaptions = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setCaptions('');
    setStats(null);
    setCopySuccess(false);

    try {
      const response = await fetch('/api/youtube-captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to extract captions');
      }

      setCaptions(data.captions);
      setStats({
        wordCount: data.wordCount,
        videoId: data.videoId,
        totalCaptions: data.totalCaptions,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract captions. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(captions);
      setCopySuccess(true);
      // Reset success state after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="space-y-6">
      <FeatureCard
        icon={(
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
        title="YouTube Caption Extractor"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="youtube-url" className="mb-2 block text-sm font-medium">
              YouTube Video URL
            </label>
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleExtractCaptions}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Extracting Captions...' : 'Extract Captions'}
          </Button>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {stats && (
            <div className="rounded-md bg-blue-50 p-3">
              <div className="text-sm text-blue-800">
                <div>
                  <strong>Video ID:</strong>
                  {' '}
                  {stats.videoId}
                </div>
                <div>
                  <strong>Total Captions:</strong>
                  {' '}
                  {stats.totalCaptions}
                </div>
                <div>
                  <strong>Word Count:</strong>
                  {' '}
                  {stats.wordCount}
                </div>
              </div>
            </div>
          )}

          {captions && (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold">Extracted Captions</h3>
              <div className="rounded-md border bg-gray-50 p-4">
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-sm">
                  {captions}
                </pre>
              </div>
              <div className="mt-3 flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyToClipboard}
                        className={copySuccess ? 'border-green-200 bg-green-50 text-green-700' : ''}
                      >
                        {copySuccess ? '✓ Copied!' : 'Copy to Clipboard'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy all captions to your clipboard for easy pasting</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const blob = new Blob([captions], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `captions-${stats?.videoId || 'video'}.md`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Download as Markdown
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download captions as a Markdown file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
      </FeatureCard>
    </div>
  );
};
