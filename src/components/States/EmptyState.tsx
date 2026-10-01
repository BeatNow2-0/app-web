import React from 'react';
import { Disc3 } from 'lucide-react';
import './States.css';

export function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return <div className="empty-state-ui"><Disc3 aria-hidden="true" /><h2>{title}</h2><p>{message}</p>{action}</div>;
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return <div className="card-grid" aria-label="Loading content">{Array.from({ length: count }, (_, index) => <div className="card-skeleton" key={index}><span /><i /><i /></div>)}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="error-state" role="alert"><strong>Something went wrong</strong><p>{message}</p>{onRetry && <button type="button" className="button button--secondary" onClick={onRetry}>Try again</button>}</div>;
}
