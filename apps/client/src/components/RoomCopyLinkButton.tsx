import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RoomCopyLinkButton({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const link = `${window.location.origin}/rooms/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Room link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        position: 'fixed',
        top: '16px',
        right: '72px', // Placed to the left of the Fullscreen button
        zIndex: 9999,
        background: 'var(--dm-bg)',
        border: '4px solid var(--dm-border)',
        color: 'var(--dm-text)',
        borderRadius: '0px',
        padding: '12px 16px',
        cursor: 'pointer',
        boxShadow: '4px 4px 0px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '13px',
        fontWeight: 700,
        transition: 'var(--dm-transition)'
      }}
      title="Copy Room Link"
    >
      {copied ? <CheckCircle2 size={18} color="#34d399" /> : <Copy size={18} />}
      <span style={{ display: 'none' }} className="md:inline">
        {copied ? 'Copied!' : 'Copy Link'}
      </span>
    </button>
  );
}
