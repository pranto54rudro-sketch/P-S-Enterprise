'use client';

import Link from 'next/link';
import { Bot, Sparkles } from 'lucide-react';

export default function MasterAiFab(){
  return (
    <Link href="/ai-agent" aria-label="Open Master AI" data-ui="command-center-v2" className="master-ai-fab">
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
        :global(.sb){font-size:14px;background:radial-gradient(circle at 92% 4%,rgba(91,43,191,.10),transparent 25%),linear-gradient(135deg,#f5faf8,#edf5f2 62%,#f5f1fb);min-height:100vh}
        :global(.sb .body){padding:34px 38px 110px;max-width:1680px}
        :global(.sb .body>header){position:relative;padding:4px 0 22px;margin-bottom:20px;border-bottom:1px solid rgba(143,171,161,.24)}
        :global(.sb .body>header:after){content:'';position:absolute;left:0;bottom:-2px;width:115px;height:3px;border-radius:99px;background:linear-gradient(90deg,#19d18a,#6f3fd2);animation:lineGlow 3s ease-in-out infinite}
        :global(.sb .body header h1){font-size:42px;letter-spacing:-.045em;line-height:1.02}
        :global(.sb .body header small),:global(.sb .section-title){font-size:11px;letter-spacing:.18em}
        :global(.sb .head-actions){gap:9px}
        :global(.sb .head-actions button){border-radius:12px;padding:11px 14px;font-size:11px;box-shadow:0 5px 18px rgba(10,38,31,.05)}
        :global(.sb .head-actions .primary){box-shadow:0 10px 28px rgba(8,127,91,.22)}
        :global(.sb aside){width:258px;padding:22px 14px;background:linear-gradient(180deg,#041f19 0%,#073c2f 48%,#051d17 100%);box-shadow:14px 0 38px rgba(4,32,24,.12)}
        :global(.sb .brand){padding:6px 8px 24px;margin-bottom:16px}
        :global(.sb .brand>b){width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#24e19a,#07825e);box-shadow:0 8px 26px rgba(25,209,138,.25)}
        :global(.sb .brand span){font-size:13px}
        :global(.sb .brand small){font-size:8px;letter-spacing:.14em;margin-top:3px}
        :global(.sb aside>button){font-size:12px;padding:12px 13px;margin:2px 0;border:1px solid transparent;position:relative}
        :global(.sb aside>button.active){background:linear-gradient(90deg,rgba(25,209,138,.24),rgba(111,63,210,.16));box-shadow:inset 3px 0 #5df0ad,0 9px 24px rgba(0,0,0,.10)}
        :global(.sb .rules){font-size:9px;line-height:1.35;padding:13px;background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.12);box-shadow:0 12px 30px rgba(0,0,0,.12)}
        :global(.sb .hero){padding:28px;border-radius:23px;background:radial-gradient(circle at 88% 20%,rgba(111,63,210,.20),transparent 24%),linear-gradient(135deg,#ffffff,#e8f7f0 62%,#f2edff);border:1px solid #d9e9e2;box-shadow:0 18px 45px rgba(8,52,40,.07);position:relative;overflow:hidden}
        :global(.sb .hero:after){content:'';position:absolute;width:240px;height:240px;border:1px solid rgba(8,127,91,.10);border-radius:50%;right:-70px;top:-120px;animation:orbit 10s linear infinite}
        :global(.sb .hero h2){font-size:34px;letter-spacing:-.04em;position:relative;z-index:1}
        :global(.sb .hero p){font-size:12px;max-width:720px;position:relative;z-index:1}
        :global(.sb .master-quick){position:relative;z-index:2;min-width:170px;padding:16px 18px;border-radius:17px;background:linear-gradient(135deg,#062b22,#087f5b 58%,#6f3fd2);box-shadow:0 18px 42px rgba(8,127,91,.22);animation:aiPulse 3.2s ease-in-out infinite}
        :global(.sb .cards){gap:13px}
        :global(.sb .card){border-radius:18px;min-height:126px;padding:18px;background:rgba(255,255,255,.96);box-shadow:0 12px 34px rgba(10,38,31,.06);border-color:#dce8e3;position:relative;overflow:hidden}
        :global(.sb .card:before){content:'';position:absolute;left:0;top:0;width:100%;height:3px;background:linear-gradient(90deg,#19c37d,transparent);opacity:.75}
        :global(.sb .card:nth-child(2):before){background:linear-gradient(90deg,#ef476f,transparent)}
        :global(.sb .card:nth-child(3):before){background:linear-gradient(90deg,#3b82f6,transparent)}
        :global(.sb .card:nth-child(4):before){background:linear-gradient(90deg,#7c3aed,transparent)}
        :global(.sb .card span){font-size:11px;font-weight:700;color:#657a72}
        :global(.sb .card b){font-size:27px;letter-spacing:-.035em}
        :global(.sb .card small){font-size:10px;line-height:1.4}
        :global(.sb .panel){border-radius:19px;padding:20px;box-shadow:0 15px 40px rgba(10,38,31,.055);border-color:#dce8e3;background:rgba(255,255,255,.95)}
        :global(.sb .panel h3){font-size:15px;letter-spacing:-.01em}
        :global(.sb .panel-head span){font-size:10px}
        :global(.sb .ledger){margin-top:16px}
        :global(.sb table){font-size:12px}
        :global(.sb th){font-size:10px;padding:13px 12px;background:linear-gradient(180deg,#f5f9f7,#eef5f2);position:sticky;top:0;z-index:1}
        :global(.sb td){font-size:12px;padding:14px 12px}
        :global(.sb tbody tr:hover){background:linear-gradient(90deg,#f0faf6,#fafcff)}
        :global(.sb .actions button){border-radius:8px;padding:7px 9px;font-size:10px}
        :global(.sb .danger){background:#fff3f5;color:#b42318!important;border-color:#ffd7de}
        :global(.sb .projection){background:linear-gradient(135deg,#fff,#f5f0ff)}
        :global(.sb .seg button){border-radius:999px;padding:8px 13px;font-size:10px}
        :global(.sb .seg .sel){background:linear-gradient(135deg,#062d24,#6f3fd2);box-shadow:0 7px 20px rgba(91,43,191,.18)}
        :global(.sb .overlay){background:rgba(2,22,17,.64);backdrop-filter:blur(10px)}
        :global(.sb .modal){width:min(820px,100%);border-radius:23px;padding:24px;box-shadow:0 30px 100px rgba(0,0,0,.28);border-color:#d7e7e1}
        :global(.sb .modalhead h2){font-size:25px}
        :global(.sb .form){gap:13px}
        :global(.sb .form input),:global(.sb .form select),:global(.sb .form textarea){border-radius:11px;padding:13px;background:#f7faf9;font-size:13px}
        :global(.sb .conversion){border-radius:16px;padding:18px;background:radial-gradient(circle at 90% 20%,rgba(111,63,210,.35),transparent 28%),linear-gradient(135deg,#05271f,#087f5b 60%,#4f2aa7);box-shadow:0 18px 40px rgba(6,45,36,.22);position:relative;overflow:hidden}
        :global(.sb .conversion:after){content:'';position:absolute;inset:auto -50px -90px auto;width:190px;height:190px;border:1px solid rgba(255,255,255,.13);border-radius:50%;animation:orbit 8s linear infinite}
        :global(.sb .conversion b){font-size:19px}
        :global(.sb .analytics-hero){border-radius:24px;padding:30px;background:radial-gradient(circle at 90% 20%,rgba(176,140,255,.30),transparent 25%),linear-gradient(135deg,#041f19,#0a4b3a 55%,#372061);box-shadow:0 24px 60px rgba(7,42,32,.16)}
        :global(.sb .analytics-hero h2){font-size:35px;letter-spacing:-.04em}
        :global(.sb .analytics-hero p){font-size:11px;max-width:700px}
        :global(.sb .health){min-width:175px;border-radius:20px;padding:18px;background:rgba(255,255,255,.10);box-shadow:0 10px 35px rgba(0,0,0,.12)}
        :global(.sb .health b){font-size:46px}
        :global(.sb .analytics-grid){gap:16px}
        :global(.sb .mini-panel){border-radius:19px;padding:20px;box-shadow:0 15px 40px rgba(10,38,31,.06)}
        :global(.sb .chart-panel){min-height:260px}
        :global(.sb .chart-area){height:165px}
        :global(.sb .bars i){width:14px;border-radius:7px 7px 0 0}
        :global(.sb .flow-panel){padding:21px}
        :global(.sb .flow>div){border-radius:16px;min-height:105px;padding:17px}
        :global(.sb .flow strong){font-size:19px}
        :global(.sb .activity-list>div){padding:13px 3px}
        :global(.sb .master-ai-fab){min-width:230px;padding:15px 17px;border-radius:20px}
        :global(.sb-loading){font-size:15px;background:linear-gradient(135deg,#eef8f4,#f3effb);color:#073b2d}
        @keyframes lineGlow{0%,100%{width:115px;opacity:.7}50%{width:190px;opacity:1}}
        @keyframes orbit{to{transform:rotate(360deg)}}
        @media(max-width:1050px){:global(.sb .body){padding:26px}.sb .cards{grid-template-columns:repeat(2,1fr)}:global(.sb .analytics-grid){grid-template-columns:1fr}:global(.sb .analytics-side){grid-template-columns:repeat(3,1fr)}}
        @media(max-width:700px){:global(.sb aside){display:none}:global(.sb .body){padding:18px 14px 105px}:global(.sb .body header h1){font-size:32px}:global(.sb .hero){padding:20px;display:block}:global(.sb .hero h2){font-size:25px}:global(.sb .master-quick){margin-top:15px;display:inline-grid}:global(.sb .cards){grid-template-columns:1fr}:global(.sb .card){min-height:110px}:global(.sb .analytics-hero h2){font-size:26px}:global(.sb .health){margin-top:16px}:global(.sb .analytics-side){grid-template-columns:1fr}:global(.sb .flow){grid-template-columns:1fr}:global(.sb .flow>i){display:none}:global(.sb .modal){padding:18px}:global(.sb .master-ai-fab){right:12px;bottom:12px;min-width:0;padding:12px;border-radius:16px}:global(.sb .master-ai-copy){display:none}}
      `}</style>
    </Link>
  );
}
