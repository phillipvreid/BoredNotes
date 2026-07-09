import React from 'react';
import { ToastProvider, useToast } from 'borednotes';

// Preview plumbing (capture determinism, not app usage):
// 1. showToast auto-hides after ~1.25s, so re-show it faster than that.
// 2. The toast fades in via an Animated spring, and the capture screenshot can
//    fire before opacity reaches 1 — the .toast-host CSS pins the wrap at full
//    opacity so the entrance animation can't race the screenshot.
function KeepShowing({ message }: { message: string }) {
  const { showToast } = useToast();
  React.useEffect(() => {
    showToast(message);
    const t = setInterval(() => showToast(message), 900);
    return () => clearInterval(t);
  }, [showToast, message]);
  return null;
}

const pinOpacity = `.toast-host > div { opacity: 1 !important; transform: none !important; }`;

function Host({ message }: { message: string }) {
  return (
    <div
      className="toast-host"
      style={{ position: 'relative', width: 360, height: 210, background: '#FBFAF3', borderRadius: 12, overflow: 'hidden' }}
    >
      <style>{pinOpacity}</style>
      <ToastProvider>
        <KeepShowing message={message} />
      </ToastProvider>
    </div>
  );
}

// The save confirmation sticker, hosted over a paper screen area.
export const SavedToast = () => <Host message="SAVED. POINTLESS. PERFECT." />;

// A different deadpan line.
export const FiledUnderNonsense = () => <Host message="FILED UNDER NONSENSE." />;
