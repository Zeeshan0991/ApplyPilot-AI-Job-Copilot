import { useState } from 'react';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-white/40 hover:text-white/80 border border-white/10 hover:border-white/30 px-3 py-1 rounded-md transition-all duration-200"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export default CopyButton;