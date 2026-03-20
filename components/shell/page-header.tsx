'use client';

import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  onAskLexi?: () => void;
}

export function PageHeader({ title, description, actions, onAskLexi }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-desc">{description}</p>}
      </div>
      <div className="page-header-actions">
        {actions}
        {onAskLexi && (
          <button className="page-header-lexi-btn" onClick={onAskLexi}>
            Ask Lexi
          </button>
        )}
      </div>
    </div>
  );
}
