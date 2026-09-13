'use client';

import Link from 'next/link';
import { Bot, Sparkles } from 'lucide-react';

export default function MasterAiFab(){
  return (
    <Link href="/ai-agent" aria-label="Open Master AI" className="master-ai-fab">
      <span className="master-ai-icon"><Bot size={21}/><i/></span>
      <span className="master-ai-copy"><strong>Master AI</strong><small>Ask your live ledger</small></span>
      <Sparkles size={16} className="master-ai-spark"/>
      <style jsx>{`
        .master-ai-fab{position:fixed;right:24px;bottom:24px;z-index:1000;display:flex;align-items:center;gap:11px;min-width:205px;padding:13px 15px;border:1px solid rgba(93,240,173,.65);border-radius:18px;background:linear-gradient(135deg,#05271f,#087f5b 58%,#5b2bbf);color:#fff;text-decoration:none;box-shadow:0 20px 55px rgba(4,38,29,.32),0 0 28px rgba(91,43,191,.18),0 0 0 1px rgba(255,255,255,.07) inset;transition:transform .2s ease,box-shadow .2s ease,filter .2s ease;animation:aiPulse 3.2s ease-in-out infinite}
        .master-ai-fab:hover{transform:translateY(-5px) scale(1.015);box-shadow:0 26px 65px rgba(4,38,29,.38),0 0 34px rgba(91,43,191,.25);filter:saturate(1.08)}
        .master-ai-icon{position:relative;width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,#b08cff,#6f3fd2);box-shadow:0 8px 22px rgba(116,65,211,.32)}
        .master-ai-icon i{position:absolute;width:8px;height:8px;border-radius:50%;right:-2px;bottom:-2px;background:#5df0ad;border:2px solid #062d24}
        .master-ai-copy{display:block;flex:1}.master-ai-copy strong,.master-ai-copy small{display:block}.master-ai-copy strong{font:900 14px 'Space Grotesk',Inter,sans-serif;letter-spacing:.01em}.master-ai-copy small{font-size:10px;color:#c7f4e1;margin-top:3px}.master-ai-spark{color:#bdf9dd}
        @keyframes aiPulse{0%,100%{box-shadow:0 20px 55px rgba(4,38,29,.32),0 0 28px rgba(91,43,191,.18)}50%{box-shadow:0 22px 62px rgba(4,38,29,.36),0 0 38px rgba(91,43,191,.28)}}
        :global(.sb){font-size:14px}
        :global(.sb .body){font-size:14px}
        :global(.sb .body header small),:global(.sb .section-title){font-size:11px}
        :global(.sb aside>button){font-size:13px;padding:12px}
        :global(.sb .rules){font-size:11px}
        :global(.sb .card span){font-size:12px}
        :global(.sb .card b){font-size:25px}
        :global(.sb .card small){font-size:10px}
        :global(.sb table){font-size:12px}
        :global(.sb th){font-size:11px}
        :global(.sb td){font-size:12px;padding:13px}
        :global(.sb .panel h3){font-size:14px}
        :global(.sb .panel-head span){font-size:10px}
        :global(.sb .form label){font-size:12px}
        :global(.sb .form input),:global(.sb .form select),:global(.sb .form textarea){font-size:13px;padding:12px}
        :global(.sb .form small),:global(.sb .hint),:global(.sb .warn){font-size:10px}
        @media(max-width:700px){.master-ai-fab{right:14px;bottom:14px;min-width:0;padding:11px;border-radius:15px}.master-ai-copy{display:none}}
      `}</style>
    </Link>
  );
}
