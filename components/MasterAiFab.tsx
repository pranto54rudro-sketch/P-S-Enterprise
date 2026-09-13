'use client';

import Link from 'next/link';
import { Bot, Sparkles } from 'lucide-react';

export default function MasterAiFab(){
  return (
    <Link href="/ai-agent" aria-label="Open Master AI" data-ui="command-center-v3" className="master-ai-fab">
      <span className="master-ai-icon"><Bot size={21}/><i/></span>
      <span className="master-ai-copy"><strong>Master AI</strong><small>Live ledger intelligence</small></span>
      <Sparkles size={16} className="master-ai-spark"/>
      <style jsx>{`
        .master-ai-fab{position:fixed;right:24px;bottom:24px;z-index:1000;display:flex;align-items:center;gap:11px;min-width:230px;padding:15px 17px;border:1px solid rgba(93,240,173,.65);border-radius:20px;background:linear-gradient(135deg,#041d17 0%,#087f5b 56%,#5b2bbf 100%);color:#fff;text-decoration:none;box-shadow:0 22px 60px rgba(4,38,29,.34),0 0 32px rgba(91,43,191,.20),0 0 0 1px rgba(255,255,255,.08) inset;transition:transform .2s ease,box-shadow .2s ease,filter .2s ease;animation:aiPulse 3.2s ease-in-out infinite}
        .master-ai-fab:hover{transform:translateY(-5px) scale(1.015);box-shadow:0 30px 78px rgba(4,38,29,.40),0 0 42px rgba(91,43,191,.30);filter:saturate(1.1)}
        .master-ai-icon{position:relative;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#b08cff,#6f3fd2);box-shadow:0 10px 26px rgba(116,65,211,.34)}
        .master-ai-icon i{position:absolute;width:8px;height:8px;border-radius:50%;right:-2px;bottom:-2px;background:#5df0ad;border:2px solid #062d24}
        .master-ai-copy{display:block;flex:1}.master-ai-copy strong,.master-ai-copy small{display:block}.master-ai-copy strong{font:900 14px 'Space Grotesk',Inter,sans-serif}.master-ai-copy small{font-size:10px;color:#c7f4e1;margin-top:3px}.master-ai-spark{color:#bdf9dd}
        @keyframes aiPulse{0%,100%{box-shadow:0 22px 60px rgba(4,38,29,.34),0 0 32px rgba(91,43,191,.20)}50%{box-shadow:0 25px 70px rgba(4,38,29,.38),0 0 44px rgba(91,43,191,.30)}}
        :global(.sb){font-size:14px;background:radial-gradient(circle at 92% 4%,rgba(91,43,191,.10),transparent 25%),linear-gradient(135deg,#f5faf8,#edf5f2 62%,#f5f1fb);min-height:100vh}
        :global(.sb .body){padding:34px 38px 112px;max-width:1680px}
        :global(.sb .body>header){position:relative;padding:4px 0 22px;margin-bottom:20px;border-bottom:1px solid rgba(143,171,161,.24)}
        :global(.sb .body>header:after){content:'';position:absolute;left:0;bottom:-2px;width:120px;height:3px;border-radius:99px;background:linear-gradient(90deg,#19d18a,#6f3fd2);animation:lineGlow 3s ease-in-out infinite}
        :global(.sb .body header h1){font-size:44px;letter-spacing:-.05em;line-height:1.02}
        :global(.sb .body header small),:global(.sb .section-title){font-size:11px;letter-spacing:.18em}
        :global(.sb .head-actions){gap:10px}
        :global(.sb .head-actions button){border-radius:13px;padding:11px 15px;font-size:11px;box-shadow:0 6px 20px rgba(10,38,31,.06);transition:transform .18s ease,box-shadow .18s ease}
        :global(.sb .head-actions button:hover){transform:translateY(-2px);box-shadow:0 10px 26px rgba(10,38,31,.10)}
        :global(.sb .head-actions .primary){box-shadow:0 11px 30px rgba(8,127,91,.24)}
        :global(.sb aside){width:270px;padding:22px 14px;background:linear-gradient(180deg,#041c16 0%,#073c2f 50%,#041b15 100%);box-shadow:16px 0 42px rgba(4,32,24,.13)}
        :global(.sb .brand){padding:7px 8px 25px;margin-bottom:17px}
        :global(.sb .brand>b){width:46px;height:46px;border-radius:15px;background:linear-gradient(135deg,#24e19a,#07825e);box-shadow:0 9px 28px rgba(25,209,138,.27)}
        :global(.sb .brand span){font-size:13px}.sb .brand small{font-size:8px;letter-spacing:.15em;margin-top:3px}
        :global(.sb aside>button){font-size:12px;padding:12px 14px;margin:2px 0;border:1px solid transparent;position:relative;transition:transform .18s ease,background .18s ease}
        :global(.sb aside>button:hover){transform:translateX(3px);background:rgba(255,255,255,.055)}
        :global(.sb aside>button.active){background:linear-gradient(90deg,rgba(25,209,138,.25),rgba(111,63,210,.17));box-shadow:inset 3px 0 #5df0ad,0 9px 24px rgba(0,0,0,.10)}
        :global(.sb .rules){font-size:9px;line-height:1.45;padding:14px;background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.12);box-shadow:0 12px 30px rgba(0,0,0,.12)}
        :global(.sb .hero){padding:30px;border-radius:24px;background:radial-gradient(circle at 88% 20%,rgba(111,63,210,.20),transparent 24%),linear-gradient(135deg,#fff,#e8f7f0 62%,#f2edff);border:1px solid #d9e9e2;box-shadow:0 20px 50px rgba(8,52,40,.08);position:relative;overflow:hidden}
        :global(.sb .hero:before){content:'';position:absolute;width:330px;height:330px;right:-150px;top:-160px;border:1px solid rgba(111,63,210,.12);border-radius:50%;animation:orbit 14s linear infinite}
        :global(.sb .hero:after){content:'';position:absolute;width:180px;height:180px;right:30px;bottom:-120px;border:1px solid rgba(8,127,91,.12);border-radius:50%;animation:orbit 9s linear reverse infinite}
        :global(.sb .hero h2){font-size:36px;letter-spacing:-.045em;position:relative;z-index:1}
        :global(.sb .hero p){font-size:12px;max-width:760px;position:relative;z-index:1}
        :global(.sb .master-quick){position:relative;z-index:2;min-width:180px;padding:17px 19px;border-radius:18px;background:linear-gradient(135deg,#062b22,#087f5b 58%,#6f3fd2);box-shadow:0 20px 46px rgba(8,127,91,.23);animation:aiPulse 3.2s ease-in-out infinite}
        :global(.sb .cards){gap:14px}
        :global(.sb .card){border-radius:19px;min-height:128px;padding:19px;background:rgba(255,255,255,.97);box-shadow:0 13px 38px rgba(10,38,31,.065);border-color:#dce8e3;position:relative;overflow:hidden;transition:transform .18s ease,box-shadow .18s ease}
        :global(.sb .card:hover){transform:translateY(-3px);box-shadow:0 20px 44px rgba(10,38,31,.10)}
        :global(.sb .card:before){content:'';position:absolute;left:0;top:0;width:100%;height:3px;background:linear-gradient(90deg,#19c37d,transparent);opacity:.78}
        :global(.sb .card:nth-child(2):before){background:linear-gradient(90deg,#ef476f,transparent)}:global(.sb .card:nth-child(3):before){background:linear-gradient(90deg,#3b82f6,transparent)}:global(.sb .card:nth-child(4):before){background:linear-gradient(90deg,#7c3aed,transparent)}
        :global(.sb .card span){font-size:11px;font-weight:700;color:#657a72}:global(.sb .card b){font-size:28px;letter-spacing:-.04em}:global(.sb .card small){font-size:10px;line-height:1.4}
        :global(.sb .panel){border-radius:20px;padding:21px;box-shadow:0 16px 42px rgba(10,38,31,.06);border-color:#dce8e3;background:rgba(255,255,255,.96)}
        :global(.sb .panel h3){font-size:15px;letter-spacing:-.01em}:global(.sb .panel-head span){font-size:10px}
        :global(.sb .ledger){margin-top:16px}:global(.sb table){font-size:12px}:global(.sb th){font-size:10px;padding:14px 12px;background:linear-gradient(180deg,#f5f9f7,#eef5f2);position:sticky;top:0;z-index:1}:global(.sb td){font-size:12px;padding:14px 12px}:global(.sb tbody tr){transition:background .15s ease}:global(.sb tbody tr:hover){background:linear-gradient(90deg,#f0faf6,#fafcff)}
        :global(.sb .actions button){border-radius:9px;padding:7px 9px;font-size:10px;transition:transform .15s ease}:global(.sb .actions button:hover){transform:translateY(-1px)}:global(.sb .danger){background:#fff3f5;color:#b42318!important;border-color:#ffd7de}
        :global(.sb .projection){background:linear-gradient(135deg,#fff,#f5f0ff)}:global(.sb .seg button){border-radius:999px;padding:8px 13px;font-size:10px}:global(.sb .seg .sel){background:linear-gradient(135deg,#062d24,#6f3fd2);box-shadow:0 7px 20px rgba(91,43,191,.18)}
        :global(.sb .overlay){background:rgba(2,22,17,.64);backdrop-filter:blur(12px)}:global(.sb .modal){width:min(820px,100%);border-radius:24px;padding:25px;box-shadow:0 32px 110px rgba(0,0,0,.30);border-color:#d7e7e1}:global(.sb .modalhead h2){font-size:26px}
        :global(.sb .form){gap:14px}:global(.sb .form input),:global(.sb .form select),:global(.sb .form textarea){border-radius:12px;padding:13px;background:#f7faf9;font-size:13px;transition:border-color .15s ease,box-shadow .15s ease}:global(.sb .form input:focus),:global(.sb .form select:focus),:global(.sb .form textarea:focus){outline:none;box-shadow:0 0 0 3px rgba(25,209,138,.12);border-color:#1acb85}
        :global(.sb .conversion){border-radius:17px;padding:19px;background:radial-gradient(circle at 90% 20%,rgba(111,63,210,.35),transparent 28%),linear-gradient(135deg,#05271f,#087f5b 60%,#4f2aa7);box-shadow:0 20px 44px rgba(6,45,36,.23);position:relative;overflow:hidden}:global(.sb .conversion:after){content:'';position:absolute;right:-55px;bottom:-95px;width:200px;height:200px;border:1px solid rgba(255,255,255,.13);border-radius:50%;animation:orbit 8s linear infinite}:global(.sb .conversion b){font-size:20px}
        :global(.sb .analytics-hero){border-radius:25px;padding:31px;background:radial-gradient(circle at 90% 20%,rgba(176,140,255,.30),transparent 25%),linear-gradient(135deg,#041f19,#0a4b3a 55%,#372061);box-shadow:0 25px 65px rgba(7,42,32,.17)}:global(.sb .analytics-hero h2){font-size:36px;letter-spacing:-.045em}:global(.sb .analytics-hero p){font-size:11px;max-width:720px}:global(.sb .health){min-width:180px;border-radius:21px;padding:19px;background:rgba(255,255,255,.10);box-shadow:0 11px 38px rgba(0,0,0,.13)}:global(.sb .health b){font-size:48px}
        :global(.sb .analytics-grid){gap:17px}:global(.sb .mini-panel){border-radius:20px;padding:21px;box-shadow:0 16px 42px rgba(10,38,31,.065)}:global(.sb .chart-panel){min-height:270px}:global(.sb .chart-area){height:170px}:global(.sb .bars i){width:14px;border-radius:7px 7px 0 0}:global(.sb .flow-panel){padding:22px}:global(.sb .flow>div){border-radius:17px;min-height:108px;padding:18px}:global(.sb .flow strong){font-size:20px}:global(.sb .activity-list>div){padding:14px 3px}
        :global(.sb-loading){font-size:15px;background:linear-gradient(135deg,#eef8f4,#f3effb);color:#073b2d;min-height:100vh;display:grid;place-items:center}
        @keyframes lineGlow{0%,100%{width:120px;opacity:.72}50%{width:200px;opacity:1}}@keyframes orbit{to{transform:rotate(360deg)}}
        @media(max-width:1050px){:global(.sb .body){padding:27px}.sb .cards{grid-template-columns:repeat(2,1fr)}:global(.sb .analytics-grid){grid-template-columns:1fr}:global(.sb .analytics-side){grid-template-columns:repeat(3,1fr)}}
        @media(max-width:700px){:global(.sb aside){display:none}:global(.sb .body){padding:18px 14px 106px}:global(.sb .body header h1){font-size:32px}:global(.sb .hero){padding:21px;display:block}:global(.sb .hero h2){font-size:26px}:global(.sb .master-quick){margin-top:15px;display:inline-grid}:global(.sb .cards){grid-template-columns:1fr}:global(.sb .card){min-height:112px}:global(.sb .analytics-hero h2){font-size:27px}:global(.sb .health){margin-top:16px}:global(.sb .analytics-side){grid-template-columns:1fr}:global(.sb .flow){grid-template-columns:1fr}:global(.sb .flow>i){display:none}:global(.sb .modal){padding:18px}:global(.sb .master-ai-fab){right:12px;bottom:12px;min-width:0;padding:12px;border-radius:17px}:global(.sb .master-ai-copy){display:none}}
      `}</style>
    </Link>
  );
}
