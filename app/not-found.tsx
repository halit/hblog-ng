import React from 'react';
import { Metadata } from 'next';
import ErrorPageTemplate from '@/components/ErrorPageTemplate';
import SmartSuggestions from '@/components/SmartSuggestions';

export const metadata: Metadata = {
  title: 'Signal Lost',
  description: 'The requested datapoint does not exist in this reality.',
};

export default function NotFound() {
  return (
    <ErrorPageTemplate
      code="404"
      title="Signal Lost"
      message="The requested datapoint cannot be located. The vector you are attempting to access does not exist or has been redacted from the archives."
      isDefense={true}
    >
      <SmartSuggestions />
    </ErrorPageTemplate>
  );
}
