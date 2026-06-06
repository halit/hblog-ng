'use client';

import { useState } from 'react';
import PostDetail from '@/components/pages/PostDetail';
import { SignatureModal, BibtexModal, ShareModal } from '@/components/Modals';
import { VaultNode } from '@/types/vault';

interface UnifiedPostDetailWrapperProps {
  activeNode: VaultNode;
  connectedNodes: VaultNode[];
}

export default function UnifiedPostDetailWrapper({
  activeNode,
  connectedNodes,
}: UnifiedPostDetailWrapperProps) {
  const [signatureOpen, setSignatureOpen] = useState<string | null>(null);
  const [bibtexOpen, setBibtexOpen] = useState<string | null>(null);
  const [shareData, setShareData] = useState<{
    url: string;
    title: string;
    description?: string;
  } | null>(null);

  return (
    <>
      <PostDetail
        activeNode={activeNode}
        connectedNodes={connectedNodes}
        setBibtexOpen={setBibtexOpen}
        setSignatureOpen={setSignatureOpen}
        setShareOpen={(url, title, description) => setShareData({ url, title, description })}
      />

      <SignatureModal
        isOpen={!!signatureOpen}
        onClose={() => setSignatureOpen(null)}
        signature={signatureOpen}
      />

      <BibtexModal isOpen={!!bibtexOpen} onClose={() => setBibtexOpen(null)} bibtex={bibtexOpen} />

      <ShareModal
        isOpen={!!shareData}
        onClose={() => setShareData(null)}
        url={shareData?.url || ''}
        title={shareData?.title || ''}
        description={shareData?.description}
      />
    </>
  );
}
