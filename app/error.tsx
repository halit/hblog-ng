'use client';

import { useEffect } from 'react';
import ErrorPageTemplate from '@/components/ErrorPageTemplate';
import SmartSuggestions from '@/components/SmartSuggestions';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <ErrorPageTemplate
      code="500"
      title="System Failure"
      message="Critical error encountered during execution. The system has been compromised or a logic gate has failed. Diagnostics have been logged."
      isDefense={false}
      onRetry={reset}
    >
      {/* Even on 500 errors, suggestions might be helpful if the user was looking for something specific */}
      <SmartSuggestions />
    </ErrorPageTemplate>
  );
}
