'use client';

import Link from 'next/link';
import { Bot, Sparkles } from 'lucide-react';

export default function MasterAiFab(){
  return (
    <Link href="/ai-agent" aria-label="Open Master AI" className="master-ai-fab">
      <span className="master-ai-icon"><Bot size={18}/><i/></span>
      <span className="master-ai-copy"><strong>Master AI</strong><small>Ask your live ledger</small></span>
      <Sparkles size={14} className="master-ai-spark"/>
      <style jsx>{`
        .master-ai-fab{position:fixed;right:24px;bottom:24px;z-index:1000;display:flex;align-items:center;gap:9px;min-width:166px;padding:10px 12px;border:1px solid rgba(93,240,173,.55);border-radius:16px;background:linear-gradient(135deg,#062d24,#0b513e);color:#fff;text-decoration:none;box-shadow:0 18px 45px rgba(4,38,29,.28),0 0 0 1px rgba(255,255,255,.05) inset;transition:transform .2s ease,box-shadow .2s ease}
        .master-ai-fab:hover{transform:translateY(-4px);box-shadow:0 24px 55px rgba(4,38,29,.35)}
        .master-ai-icon{position:relative;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#b08cff,#6f3fd2);box-shadow:0 7px 18px rgba(116,65,211,.25)}
        .master-ai-icon i{position:absolute;width:7px;height:7px;border-radius:50%;right:-2px;bottom:-2px;background:#5df0ad;border:2px solid #062d24}
        .master-ai-copy{display:block;flex:1}.master-ai-copy strong,.master-ai-copy small{display:block}.master-ai-copy strong{font:800 11px 'Space Grotesk',Inter,sans-serif}.master-ai-copy small{font-size:8px;color:#a9d8c5;margin-top:2px}.master-ai-spark{color:#8ef0c5}
        @media(max-width:700px){.master-ai-fab{right:14px;bottom:14px;min-width:0;padding:10px;border-radius:14px}.master-ai-copy{display:none}}
      `}</style>
    </Link>
  );
}
