import { useEffect, useRef, useState } from 'react';
import { X, Play, Volume2, VolumeX } from 'lucide-react';

const C1 = '#2EC4B6', C2 = '#6C5CE7', C3 = '#BF5AF2';
const W = 640, H = 360;

const SCENES = [
  { t: 0,   d: 1.8, title: 'Nexly', tag: 'AI · Career · Future' },
  { t: 1.8, d: 1.2, title: 'منشئ السيرة الذاتية', tag: 'Resume Builder', icon: 0 },
  { t: 3.0, d: 1.2, title: 'خطابات التغطية', tag: 'Cover Letters', icon: 1 },
  { t: 4.2, d: 1.2, title: 'متتبع الوظائف', tag: 'Job Tracker', icon: 2 },
  { t: 5.4, d: 1.2, title: 'الرسائل والمجموعات', tag: 'Messaging', icon: 5 },
  { t: 6.6, d: 1.2, title: '6 لغات عالمية', tag: '6 Languages', icon: 6 },
  { t: 7.8, d: 2.2, title: 'انطلق الآن', tag: 'ابدأ مجاناً' },
];
const SPEED = 3;
const RECORD_DUR = (SCENES[SCENES.length - 1].t + SCENES[SCENES.length - 1].d) / SPEED;

function drawIcon(ctx, id, x, y, s) {
  const h = s / 2;
  ctx.strokeStyle = C2; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(108,92,231,0.2)'; ctx.shadowBlur = 12;
  ctx.beginPath();
  if (id === 0) { // Resume
    ctx.roundRect(x - h * 0.7, y - h * 0.85, s * 0.7, s * 1.7, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - h * 0.35, y - h * 0.2); ctx.lineTo(x + h * 0.35, y - h * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - h * 0.35, y + h * 0.1); ctx.lineTo(x + h * 0.35, y + h * 0.1); ctx.stroke();
  } else if (id === 1) { // Letter
    ctx.roundRect(x - h * 0.85, y - h * 0.65, s * 0.85, s * 0.65, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - h * 0.85, y - h * 0.65); ctx.lineTo(x, y - h * 0.1); ctx.lineTo(x + h * 0.85, y - h * 0.65); ctx.stroke();
  } else if (id === 2) { // Briefcase
    ctx.roundRect(x - h * 0.8, y - h * 0.2, s * 0.8, s * 0.7, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - h * 0.4, y - h * 0.2); ctx.lineTo(x - h * 0.4, y - h * 0.5);
    ctx.moveTo(x + h * 0.4, y - h * 0.2); ctx.lineTo(x + h * 0.4, y - h * 0.5); ctx.stroke();
  } else if (id === 5) { // Chat
    ctx.roundRect(x - h * 0.8, y - h * 0.6, s * 0.8, s * 0.6, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - h * 0.15, y + h * 0.05); ctx.lineTo(x + h * 0.15, y + h * 0.5); ctx.lineTo(x + h * 0.15, y + h * 0.05); ctx.stroke();
  } else if (id === 6) { // Globe
    ctx.arc(x, y, h * 0.75, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, h * 0.75, h * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - h * 0.75); ctx.lineTo(x, y + h * 0.75); ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

export default function PromoBanner({ onDismiss }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [state, setState] = useState('loading');
  const [muted, setMuted] = useState(true);
  const videoUrlRef = useRef(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setState('error'); return;
    }

    const stream = canvas.captureStream(30);
    let recorder, animId, done = false;
    const chunks = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9' : 'video/webm';
    try { recorder = new MediaRecorder(stream, { mimeType: mime }); }
    catch { recorder = new MediaRecorder(stream, { mimeType: 'video/webm' }); }

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      videoUrlRef.current = URL.createObjectURL(blob);
      setState('ready');
    };
    recorder.start();

    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      size: 1 + Math.random() * 2,
      sx: (Math.random() - 0.5) * 0.4, sy: (Math.random() - 0.5) * 0.4 - 0.15,
      op: 0.1 + Math.random() * 0.3,
    }));

    const easeB = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

    function draw(time) {
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.5, W * 0.7);
      bg.addColorStop(0, `hsl(${260}, 65%, 22%)`); bg.addColorStop(1, '#0B0E14');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      particles.forEach(p => {
        p.x += p.sx; p.y += p.sy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108,92,231,${p.op})`; ctx.fill();
      });

      const scene = [...SCENES].reverse().find(s => time >= s.t) || SCENES[0];
      const sp = Math.min((time - scene.t) / scene.d, 1);
      const isLogo = scene === SCENES[0];
      const isCTA = scene === SCENES[SCENES.length - 1];

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

      if (isLogo) {
        const ls = 0.3 + 0.7 * easeB(Math.min(sp * 2.5, 1));
        ctx.save(); ctx.globalAlpha = Math.min(sp * 3, 1);
        ctx.translate(W / 2 - 25, H / 2 - 55); ctx.scale(ls * 0.55, ls * 0.55);
        ctx.fillStyle = C1; ctx.beginPath(); ctx.roundRect(-20, -25, 20, 42, 4); ctx.fill();
        ctx.fillStyle = C2; ctx.beginPath(); ctx.roundRect(0, -33, 20, 58, 4); ctx.fill();
        ctx.fillStyle = C3; ctx.beginPath(); ctx.roundRect(20, -17, 20, 33, 4); ctx.fill();
        ctx.restore();

        const tA = Math.max(0, Math.min((sp - 0.2) * 5, 1));
        ctx.save(); ctx.globalAlpha = tA;
        ctx.font = 'bold 32px Tajawal,sans-serif';
        const g = ctx.createLinearGradient(W / 2 - 80, 0, W / 2 + 80, 0);
        g.addColorStop(0, C1); g.addColorStop(0.5, C2); g.addColorStop(1, C3);
        ctx.fillStyle = g; ctx.fillText('Nexly', W / 2, H / 2 - 5);
        ctx.font = '500 11px Tajawal,sans-serif'; ctx.fillStyle = '#6b7494';
        ctx.fillText('AI · Career · Future', W / 2, H / 2 + 30);
        ctx.restore();
      } else if (isCTA) {
        const cA = Math.max(0, Math.min((sp - 0.1) * 5, 1));
        ctx.save(); ctx.globalAlpha = cA;
        ctx.font = 'bold 28px Tajawal,sans-serif';
        const g = ctx.createLinearGradient(W / 2 - 80, 0, W / 2 + 80, 0);
        g.addColorStop(0, C1); g.addColorStop(0.5, C2); g.addColorStop(1, C3);
        ctx.fillStyle = g; ctx.fillText('انطلق الآن 🚀', W / 2, H / 2 - 10);
        ctx.font = '500 13px Tajawal,sans-serif'; ctx.fillStyle = '#b0b8cc';
        ctx.fillText('سجل مجاناً وابدأ رحلتك المهنية', W / 2, H / 2 + 25);
        ctx.restore();
      } else {
        const vis = Math.min(sp * 3, 1);
        const iS = 0.5 + 0.5 * easeB(Math.min(sp * 3, 1));
        ctx.save(); ctx.translate(W / 2, H / 2 - 35); ctx.scale(iS, iS); ctx.globalAlpha = vis;
        drawIcon(ctx, scene.icon, 0, 0, 24); ctx.restore();

        const tA = Math.max(0, Math.min((sp - 0.15) * 5, 1));
        ctx.save(); ctx.globalAlpha = tA;
        ctx.font = 'bold 26px Tajawal,sans-serif';
        const g = ctx.createLinearGradient(W / 2 - 60, 0, W / 2 + 60, 0);
        g.addColorStop(0, C1); g.addColorStop(0.5, C2); g.addColorStop(1, C3);
        ctx.fillStyle = g; ctx.fillText(scene.title, W / 2, H / 2 + 20);
        ctx.font = '600 11px Tajawal,sans-serif'; ctx.fillStyle = C2;
        ctx.fillText(scene.tag, W / 2, H / 2 + 48);
        ctx.restore();
      }
    }

    const start = performance.now();
    const frame = () => {
      if (done) return;
      const elapsed = (performance.now() - start) / 1000;
      draw(Math.min(elapsed * SPEED, 10));
      if (elapsed < RECORD_DUR) { animId = requestAnimationFrame(frame); }
      else { setTimeout(() => { if (!done && recorder.state !== 'inactive') recorder.stop(); }, 100); done = true; }
    };
    animId = requestAnimationFrame(frame);

    return () => {
      done = true;
      cancelAnimationFrame(animId);
      try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch {}
    };
  }, []);

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-[#0B0E14] rounded-2xl overflow-hidden border border-gray-800 shadow-lg">
      <canvas ref={canvasRef} className="hidden" />

      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' }} />

      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                <rect x="1" y="3" width="3" height="6" rx="0.6" fill="#2EC4B6"/>
                <rect x="4.5" y="1.5" width="3" height="9" rx="0.6" fill="#6C5CE7"/>
                <rect x="8" y="4.5" width="3" height="4.5" rx="0.6" fill="#BF5AF2"/>
              </svg>
              <span className="text-xs font-bold text-white tracking-tight">Nexly Promo</span>
            </div>
            <span className="text-[10px] text-gray-500">تعريفي</span>
          </div>
          <div className="flex items-center gap-1">
            {state === 'ready' && (
              <button onClick={() => setMuted(m => !m)}
                className="p-1 text-gray-400 hover:text-white transition-colors">
                {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
            )}
            <button onClick={() => { setDismissed(true); onDismiss?.(); }}
              className="p-1 text-gray-500 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {state === 'loading' && (
          <div className="flex items-center justify-center" style={{ height: 200 }}>
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">جاري تحميل الفيديو...</p>
            </div>
          </div>
        )}

        {state === 'ready' && videoUrlRef.current && (
          <div className="relative rounded-xl overflow-hidden bg-black" style={{ maxHeight: 220 }}>
            <video
              ref={videoRef}
              src={videoUrlRef.current}
              autoPlay loop muted={muted} playsInline
              className="w-full h-full object-cover"
              style={{ maxHeight: 220 }}
            />
            <div className="absolute bottom-2 right-2">
              <span className="text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {muted ? '🔇 صامت' : '🔊 صوت'}
              </span>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="flex items-center justify-center" style={{ height: 200 }}>
            <p className="text-xs text-gray-400">فيديو غير متاح على هذا المتصفح</p>
          </div>
        )}
      </div>
    </div>
  );
}
