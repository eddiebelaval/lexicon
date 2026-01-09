'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { SynthesizedAnswer, SearchSource } from '@/types';
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Link2,
  Globe,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIAnswerProps {
  answer: SynthesizedAnswer | null;
  loading?: boolean;
  error?: string | null;
  onSourceClick?: (source: SearchSource) => void;
  className?: string;
}

/**
 * Confidence indicator badge
 */
function ConfidenceBadge({
  confidence,
}: {
  confidence: SynthesizedAnswer['confidence'];
}) {
  const config = {
    high: {
      label: 'High confidence',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    medium: {
      label: 'Medium confidence',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    low: {
      label: 'Low confidence',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    },
  };

  const { label, className } = config[confidence];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        className
      )}
    >
      {label}
    </span>
  );
}

/**
 * Source citation component
 */
function SourceCitation({
  source,
  index,
  onClick,
}: {
  source: SearchSource;
  index: number;
  onClick?: (source: SearchSource) => void;
}) {
  const iconMap = {
    entity: <BookOpen className="h-3.5 w-3.5" />,
    relationship: <Link2 className="h-3.5 w-3.5" />,
    web: <Globe className="h-3.5 w-3.5" />,
  };

  const handleClick = () => {
    if (source.type === 'web' && source.url) {
      window.open(source.url, '_blank', 'noopener,noreferrer');
    } else if (onClick) {
      onClick(source);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
        'bg-muted/50 hover:bg-muted transition-colors',
        'border border-border/50 hover:border-border',
        onClick || source.url ? 'cursor-pointer' : 'cursor-default'
      )}
    >
      <span className="text-muted-foreground">{index + 1}.</span>
      {iconMap[source.type]}
      <span className="font-medium truncate max-w-[150px]">{source.name}</span>
      {source.url && (
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

/**
 * Loading skeleton for AI answer
 */
function AIAnswerSkeleton() {
  return (
    <div className="rounded-lg border bg-gradient-to-br from-lexicon-50/50 to-background p-4 dark:from-lexicon-950/20">
      <div className="flex items-center gap-2 mb-3">
        <Loader2 className="h-4 w-4 animate-spin text-lexicon-500" />
        <span className="text-sm font-medium text-lexicon-600 dark:text-lexicon-400">
          Thinking...
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted/50 rounded animate-pulse w-full" />
        <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-muted/50 rounded animate-pulse w-4/6" />
      </div>
    </div>
  );
}

/**
 * AIAnswer - Display AI-synthesized search answers
 *
 * Features:
 * - Markdown-rendered answer text
 * - Source citations with clickable links
 * - Confidence indicator
 * - Copy answer button
 * - Collapsible sources section
 * - Loading and error states
 */
export function AIAnswer({
  answer,
  loading = false,
  error = null,
  onSourceClick,
  className,
}: AIAnswerProps) {
  const [copied, setCopied] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(true);

  // Loading state
  if (loading) {
    return <AIAnswerSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          'rounded-lg border border-destructive/50 bg-destructive/5 p-4',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <h3 className="font-medium text-destructive">
              Unable to generate AI answer
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No answer state
  if (!answer) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(answer.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const hasSources = answer.sources && answer.sources.length > 0;

  return (
    <div
      className={cn(
        'rounded-lg border bg-gradient-to-br from-lexicon-50/50 to-background',
        'dark:from-lexicon-950/20 dark:to-background',
        'shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-lexicon-500" />
          <span className="text-sm font-medium">AI Answer</span>
          <ConfidenceBadge confidence={answer.confidence} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Answer Content */}
      <div className="px-4 py-4">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              // Custom styling for markdown elements
              p: ({ children }) => (
                <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-3 pl-4 list-disc space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-3 pl-4 list-decimal space-y-1">{children}</ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="px-1 py-0.5 rounded bg-muted text-sm font-mono">
                  {children}
                </code>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lexicon-600 hover:text-lexicon-700 underline dark:text-lexicon-400"
                >
                  {children}
                </a>
              ),
            }}
          >
            {answer.answer}
          </ReactMarkdown>
        </div>
      </div>

      {/* Sources Section */}
      {hasSources && (
        <div className="border-t">
          <button
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
            className="flex items-center justify-between w-full px-4 py-2 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            <span className="font-medium">
              Sources ({answer.sources.length})
            </span>
            {sourcesExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {sourcesExpanded && (
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {answer.sources.map((source, index) => (
                  <SourceCitation
                    key={`${source.type}-${source.name}-${index}`}
                    source={source}
                    index={index}
                    onClick={onSourceClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Powered by Claude badge */}
      <div className="px-4 py-2 border-t bg-muted/20">
        <span className="text-xs text-muted-foreground">
          Powered by Claude
        </span>
      </div>
    </div>
  );
}

/**
 * Compact variant for inline display
 */
export function AIAnswerCompact({
  answer,
  loading,
  className,
}: {
  answer: SynthesizedAnswer | null;
  loading?: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-lexicon-500" />
        <span className="text-muted-foreground">Generating answer...</span>
      </div>
    );
  }

  if (!answer) return null;

  // Truncate for compact display
  const truncatedAnswer =
    answer.answer.length > 200
      ? answer.answer.slice(0, 200) + '...'
      : answer.answer;

  return (
    <div
      className={cn(
        'rounded-lg border bg-muted/30 p-3',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-lexicon-500" />
        <span className="text-xs font-medium text-muted-foreground">
          AI Summary
        </span>
      </div>
      <p className="text-sm leading-relaxed">{truncatedAnswer}</p>
    </div>
  );
}
