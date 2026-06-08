'use client';

import React, { useEffect, useState } from 'react';
import { X, Copy, ShieldCheck, ShieldAlert, ShieldQuestion, Loader2 } from 'lucide-react';
import { usePublicKey } from '@/hooks/usePublicKey';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  signature: string | null;
  /** The published post content the signature covers (node.content). */
  content?: string | null;
}

type VerifyStatus = 'idle' | 'verifying' | 'valid' | 'invalid' | 'error';

interface VerifyResult {
  status: VerifyStatus;
  signer?: string;
  fingerprint?: string;
  message?: string;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  signature,
  content,
}) => {
  const publicKey = usePublicKey();
  const [result, setResult] = useState<VerifyResult>({ status: 'idle' });

  // Reset verification state whenever a different signature is shown.
  useEffect(() => {
    setResult({ status: 'idle' });
  }, [signature]);

  if (!isOpen || !signature) return null;

  const canVerify = !!content && !!publicKey && result.status !== 'verifying';

  const handleVerify = async () => {
    if (!content || !publicKey) return;
    setResult({ status: 'verifying' });
    try {
      // Loaded on demand so openpgp.js stays out of the initial bundle.
      const openpgp = await import('openpgp');
      const key = await openpgp.readKey({ armoredKey: publicKey });
      const sig = await openpgp.readSignature({ armoredSignature: signature });
      const message = await openpgp.createMessage({ text: content });
      const { signatures } = await openpgp.verify({
        message,
        signature: sig,
        verificationKeys: key,
      });

      await signatures[0].verified; // throws if the signature is not valid

      const userID = (await key.getPrimaryUser()).user.userID?.userID;
      setResult({
        status: 'valid',
        signer: userID,
        fingerprint: key.getFingerprint().toUpperCase(),
      });
    } catch (err) {
      // A bad signature throws here too; distinguish only for the message text.
      setResult({
        status: 'invalid',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-fit max-w-[95vw] bg-[#0a0f14] border border-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — unified with the other modals (mono label + close). */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center gap-4">
          <span className="font-mono text-xs text-gray-400">PGP SIGNATURE</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Text + controls fill the width set by the signature below, but
              `w-0 min-w-full` keeps them from widening the modal, so the modal
              shrinks to fit the 64-character signature lines exactly. */}
          <div className="w-0 min-w-full space-y-4">
            <div className="text-sm text-gray-400 leading-relaxed space-y-2">
              <p>
                This post is cryptographically signed so its authenticity and integrity can be
                checked.
              </p>
              <p>
                The detached PGP signature below is computed from this post&apos;s content. Click{' '}
                <span className="text-gray-300">Verify</span> to check it against the author&apos;s{' '}
                <a href="/public-key.asc" className="text-defense hover:underline">
                  public key
                </a>
                , entirely in your browser. A valid result proves the content has not been altered
                since it was signed.
              </p>
              <p className="text-xs text-gray-500">
                The signature covers the post content only, not metadata such as title, date, or
                other frontmatter fields.
              </p>
            </div>

            {/* Verify control: button + a short status badge, baseline-aligned. */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleVerify}
                disabled={!canVerify}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200 px-3 py-1.5 rounded text-xs font-mono border border-gray-700 flex items-center gap-2"
              >
                {result.status === 'verifying' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ShieldCheck size={14} />
                )}
                {result.status === 'verifying' ? 'Verifying…' : 'Verify signature'}
              </button>

              {result.status === 'idle' && !content && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
                  <ShieldQuestion size={14} /> Content unavailable
                </span>
              )}
              {result.status === 'idle' && content && !publicKey && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
                  <ShieldQuestion size={14} /> Loading key…
                </span>
              )}
              {result.status === 'idle' && content && publicKey && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
                  <ShieldQuestion size={14} /> Not verified yet
                </span>
              )}
              {result.status === 'valid' && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-defense">
                  <ShieldCheck size={14} /> Verified
                </span>
              )}
              {result.status === 'invalid' && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-offense">
                  <ShieldAlert size={14} /> Verification failed
                </span>
              )}
            </div>

            {/* Result detail on its own lines so long values wrap cleanly. */}
            {result.status === 'valid' && (
              <div className="text-[10px] text-gray-500 font-mono break-all space-y-0.5">
                <p>Signed by {result.signer}</p>
                {result.fingerprint && <p>Key fingerprint: {result.fingerprint}</p>}
              </div>
            )}
            {result.status === 'invalid' && (
              <p className="text-[10px] text-gray-500 font-mono">
                The content does not match this signature, or it was made with a different key.
              </p>
            )}
          </div>

          {/* Signature: the width anchor. `w-fit` makes the box exactly as wide
              as the 64-character armor lines, so it fills the modal with no gap. */}
          <div className="relative group w-fit max-w-full">
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => navigator.clipboard.writeText(signature)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-mono border border-gray-700 flex items-center gap-1 shadow-lg"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <pre className="w-fit max-w-full bg-gray-900 p-4 text-xs font-mono text-gray-300 border border-gray-800 rounded overflow-auto max-h-[50vh] whitespace-pre">
              {signature}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
