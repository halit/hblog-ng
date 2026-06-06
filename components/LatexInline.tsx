import React from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface LatexInlineProps {
  math: string;
}

const LatexInline: React.FC<LatexInlineProps> = ({ math }) => {
  return <InlineMath math={math} />;
};

export default LatexInline;
