import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const C1 = '#2EC4B6', C2 = '#6C5CE7', C3 = '#BF5AF2';

// 15s content at 3x speed = 5s real recording
const SCENES = [
  { t: 0,   d: 1.8, title: 'Nexly',     tag: 'AI · Career · Future',   desc: 'منصتك الذكية لبناء المستقبل المهني' },
  { t: 1.8, d: 1.5, title: 'منشئ السيرة الذاتية',  tag: 'Resume Builder',     icon: 0 },
  { t: 3.3, d: 1.5, title: 'خطابات التغطية',       tag: 'Cover Letters',      icon: 1 },
  { t: 4.8, d: 1.5, title: 'متتبع الوظائف',         tag: 'Job Tracker',        icon: 2 },
  { t: 6.3, d: 1.5, title: 'لوحة التحكم',           tag: 'Dashboard',          icon: 3 },
  { t: 7.8, d: 1.5, title: 'التواصل الاجتماعي',      tag: 'Social Feed',        icon: 4 },
  { t: 9.3, d: 1.5, title: 'الرسائل والمجموعات',    tag: 'Messaging',          icon: 5 },
  { t: 10.8,d: 1.5, title: '6 لغات عالمية',         tag: '6 Languages',        icon: 6 },
  { t: 12.3,d: 2.7, title: 'انطلق الآن',            tag: 'ابدأ مجاناً' },
];

const SPEED = 3;
const CONTENT_DURATION = SCENES[SCENES.length - 1].t + SCENES[SCENES.length - 1].d;
const RECORD_DURATION = CONTENT_DURATION / SPEED;

// Simple icon drawers
function drawIcon(ctx, id, x, y, size) {
  const s = size || 36;
  const h = s / 2;
  ctx.strokeStyle = C2;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(108,92,231,0.2)';
  ctx.shadowBlur = 15;

  ctx.beginPath();
  switch (id) {
    case 0: // Resume — document
      ctx.roundRect(x - h * 0.7, y - h * 0.85, s * 0.7, s * 1.7, 4);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - h * 0.35, y - h * 0.2); ctx.lineTo(x + h * 0.35, y - h * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - h * 0.35, y + h * 0.1); ctx.lineTo(x + h * 0.35, y + h * 0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - h * 0.35, y + h * 0.4); ctx.lineTo(x + h * 0.35, y + h * 0.4); ctx.stroke();
      break;
    case 1: // Cover letter — envelope
      ctx.roundRect(x - h * 0.85, y - h * 0.65, s * 0.85, s * 0.65, 3);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - h * 0.85, y - h * 0.65); ctx.lineTo(x, y - h * 0.1); ctx.lineTo(x + h * 0.85, y - h * 0.65); ctx.stroke();
      break;
    case 2: // Job — briefcase
      ctx.roundRect(x - h * 0.8, y - h * 0.2, s * 0.8, s * 0.7, 3);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - h * 0.4, y - h * 0.2); ctx.lineTo(x - h * 0.4, y - h * 0.5);
      ctx.moveTo(x + h * 0.4, y - h * 0.2); ctx.lineTo(x + h * 0.4, y - h * 0.5);
      ctx.stroke();
      break;
    case 3: // Dashboard — bars
      for (let i = 0; i < 3; i++) {
        const bx = x - h * 0.7 + i * s * 0.35;
        const bh = h * (0.5 + i * 0.25);
        ctx.beginPath(); ctx.moveTo(bx, y + h * 0.7); ctx.lineTo(bx, y + h * 0.7 - bh); ctx.stroke();
      }
      break;
    case 4: // Social — people
      ctx.arc(x - h * 0.3, y - h * 0.3, h * 0.3, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x - h * 0.3, y + h * 0.3, h * 0.3, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + h * 0.4, y - h * 0.1, h * 0.22, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + h * 0.4, y + h * 0.4, h * 0.22, Math.PI, 0); ctx.stroke();
      break;
    case 5: // Messages — chat bubble
      ctx.roundRect(x - h * 0.8, y - h * 0.6, s * 0.8, s * 0.6, 6);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - h * 0.15, y + h * 0.05); ctx.lineTo(x + h * 0.15, y + h * 0.5); ctx.lineTo(x + h * 0.15, y + h * 0.05); ctx.stroke();
      break;
    case 6: // Languages — globe
      ctx.arc(x, y, h * 0.75, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y, h * 0.75, h * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - h * 0.75); ctx.lineTo(x, y + h * 0.75); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - h * 0.4, y - h * 0.5); ctx.lineTo(x + h * 0.4, y - h * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - h * 0.4, y + h * 0.5); ctx.lineTo(x + h * 0.4, y + h * 0.5); ctx.stroke();
      break;
  }
  ctx.shadowBlur = 0;
}

export default function Promo() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [state, setState] = useState('generating');
  const [progress, setProgress] = useState(0);
  const videoUrlRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = 1280, h = 720;
    canvas.width = w; canvas.height = h;

    // Check MediaRecorder support
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setError('متصفحك لا يدعم تسجيل الفيديو. استخدم Chrome أو Edge.');
      return;
    }

    const stream = canvas.captureStream(30);
    let recorder, animId;
    const chunks = [];
    let startTime, done = false;

    try {
      recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9' : 'video/webm',
      });
    } catch {
      recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    }

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      videoUrlRef.current = URL.createObjectURL(blob);
      setState('ready');
    };
    recorder.onerror = () => {
      setError('فشل في تسجيل الفيديو. حاول مرة أخرى.');
    };

    recorder.start();
    startTime = performance.now();

    // Particles
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      size: 1.5 + Math.random() * 3,
      sx: (Math.random() - 0.5) * 0.5, sy: (Math.random() - 0.5) * 0.5 - 0.2,
      op: 0.1 + Math.random() * 0.3,
    }));

    const easeOut = (x) => 1 - Math.pow(1 - x, 2);
    const easeBounce = (x) => {
      if (x < 0.5) return 2 * x * x;
      return 1 - Math.pow(-2 * x + 2, 2) / 2;
    };

    function drawScene(time) {
      // BG gradient
      const tt = time * 0.003;
      const g = ctx.createRadialGradient(
        w * (0.5 + Math.sin(tt) * 0.3), h * 0.4, 0, w * 0.5, h * 0.5, w * 0.7
      );
      g.addColorStop(0, `hsl(${250 + Math.sin(tt) * 20}, 70%, 25%)`);
      g.addColorStop(0.5, `hsl(${270 + Math.sin(tt * 0.5) * 15}, 60%, 15%)`);
      g.addColorStop(1, '#0B0E14');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // Accent glow
      const g2 = ctx.createRadialGradient(w * 0.75, h * 0.75, 0, w * 0.75, h * 0.75, w * 0.35);
      g2.addColorStop(0, 'rgba(46,196,182,0.06)'); g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);

      // Particles
      particles.forEach(p => {
        p.x += p.sx; p.y += p.sy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108,92,231,${p.op})`; ctx.fill();
      });

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(108,92,231,${0.05 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }

      // Find current scene
      const scene = [...SCENES].reverse().find(s => time >= s.t) || SCENES[0];
      const sp = Math.min((time - scene.t) / scene.d, 1);
      const i = SCENES.indexOf(scene);
      const isLogo = i === 0;
      const isCTA = i === SCENES.length - 1;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isLogo) {
        // Logo bars
        const ls = 0.4 + 0.6 * easeBounce(Math.min(sp * 2.5, 1));
        ctx.save();
        ctx.globalAlpha = Math.min(sp * 3, 1);
        ctx.translate(w / 2 - 40, h / 2 - 90); ctx.scale(ls, ls);
        ctx.fillStyle = C1; ctx.beginPath(); ctx.roundRect(-25, -30, 24, 50, 5); ctx.fill();
        ctx.fillStyle = C2; ctx.beginPath(); ctx.roundRect(0, -40, 24, 70, 5); ctx.fill();
        ctx.fillStyle = C3; ctx.beginPath(); ctx.roundRect(25, -20, 24, 40, 5); ctx.fill();
        ctx.restore();

        // Title
        const tA = Math.max(0, Math.min((sp - 0.2) * 5, 1));
        const tY = -15 + 15 * Math.max(0, Math.min((sp - 0.2) * 5, 1));
        ctx.save(); ctx.globalAlpha = tA;
        ctx.font = 'bold 58px Tajawal, sans-serif';
        const grad = ctx.createLinearGradient(w / 2 - 120, 0, w / 2 + 120, 0);
        grad.addColorStop(0, C1); grad.addColorStop(0.5, C2); grad.addColorStop(1, C3);
        ctx.fillStyle = grad; ctx.fillText('Nexly', w / 2, h / 2 - 20 + tY);
        ctx.restore();

        // Tag
        const tgA = Math.max(0, Math.min((sp - 0.4) * 5, 1));
        ctx.save(); ctx.globalAlpha = tgA;
        ctx.font = '500 13px Tajawal, sans-serif';
        ctx.fillStyle = '#6b7494'; ctx.fillText('AI · Career · Future', w / 2, h / 2 + 25);
        ctx.restore();

        // Desc
        const dA = Math.max(0, Math.min((sp - 0.55) * 5, 1));
        ctx.save(); ctx.globalAlpha = dA;
        ctx.font = '500 17px Tajawal, sans-serif';
        ctx.fillStyle = '#8B95A5'; ctx.fillText('منصتك الذكية لبناء المستقبل المهني', w / 2, h / 2 + 65);
        ctx.restore();
      } else if (isCTA) {
        // Logo small
        const cS = 0.5 + 0.5 * easeBounce(Math.min(sp * 3, 1));
        ctx.save();
        ctx.globalAlpha = Math.min(sp * 3, 1);
        ctx.translate(w / 2 - 30, h / 2 - 140); ctx.scale(cS * 0.7, cS * 0.7);
        ctx.fillStyle = C1; ctx.beginPath(); ctx.roundRect(-25, -30, 24, 50, 5); ctx.fill();
        ctx.fillStyle = C2; ctx.beginPath(); ctx.roundRect(0, -40, 24, 70, 5); ctx.fill();
        ctx.fillStyle = C3; ctx.beginPath(); ctx.roundRect(25, -20, 24, 40, 5); ctx.fill();
        ctx.restore();

        const tA2 = Math.max(0, Math.min((sp - 0.12) * 5, 1));
        const tY2 = -10 + 10 * Math.max(0, Math.min((sp - 0.12) * 5, 1));
        ctx.save(); ctx.globalAlpha = tA2;
        ctx.font = 'bold 48px Tajawal, sans-serif';
        const grad2 = ctx.createLinearGradient(w / 2 - 120, 0, w / 2 + 120, 0);
        grad2.addColorStop(0, C1); grad2.addColorStop(0.5, C2); grad2.addColorStop(1, C3);
        ctx.fillStyle = grad2; ctx.fillText('انطلق في رحلتك المهنية', w / 2, h / 2 - 55 + tY2);
        ctx.restore();

        const dA2 = Math.max(0, Math.min((sp - 0.25) * 5, 1));
        ctx.save(); ctx.globalAlpha = dA2;
        ctx.font = '500 17px Tajawal, sans-serif';
        ctx.fillStyle = '#b0b8cc';
        ctx.fillText('سجل مجاناً وابدأ ببناء مستقبلك المهني بالذكاء الاصطناعي', w / 2, h / 2 + 0);
        ctx.restore();

        // Button
        const bA = Math.max(0, Math.min((sp - 0.4) * 5, 1));
        const bY = 20 - 20 * Math.max(0, Math.min((sp - 0.4) * 5, 1));
        ctx.save(); ctx.globalAlpha = bA;
        const bGrad = ctx.createLinearGradient(w / 2 - 80, 0, w / 2 + 80, 0);
        bGrad.addColorStop(0, C1); bGrad.addColorStop(0.5, C2); bGrad.addColorStop(1, C3);
        ctx.shadowColor = 'rgba(108,92,231,0.4)'; ctx.shadowBlur = 30;
        ctx.fillStyle = bGrad;
        ctx.beginPath(); ctx.roundRect(w / 2 - 80, h / 2 + 45 + bY, 160, 44, 12); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 16px Tajawal, sans-serif';
        ctx.fillStyle = '#fff'; ctx.fillText('ابدأ مجانًا 🚀', w / 2, h / 2 + 67 + bY);
        ctx.restore();
      } else {
        // Feature scene
        const vis = Math.min(sp * 3, 1);
        const iconScale = 0.5 + 0.5 * easeBounce(Math.min(sp * 3, 1));
        const iconRot = (1 - Math.min(sp * 3, 1)) * -15;
        ctx.save();
        ctx.translate(w / 2, h / 2 - 85);
        ctx.scale(iconScale, iconScale);
        ctx.rotate(iconRot * Math.PI / 180);
        ctx.globalAlpha = vis;
        drawIcon(ctx, scene.icon, 0, 0, 40);
        ctx.restore();

        const tA3 = Math.max(0, Math.min((sp - 0.15) * 4, 1));
        const tY3 = 10 - 10 * Math.max(0, Math.min((sp - 0.15) * 5, 1));
        ctx.save(); ctx.globalAlpha = tA3;
        ctx.font = 'bold 42px Tajawal, sans-serif';
        const g3 = ctx.createLinearGradient(w / 2 - 100, 0, w / 2 + 100, 0);
        g3.addColorStop(0, C1); g3.addColorStop(0.5, C2); g3.addColorStop(1, C3);
        ctx.fillStyle = g3; ctx.fillText(scene.title, w / 2, h / 2 + 15 + tY3);
        ctx.restore();

        const sA = Math.max(0, Math.min((sp - 0.3) * 5, 1));
        ctx.save(); ctx.globalAlpha = sA;
        ctx.font = '600 13px Tajawal, sans-serif';
        ctx.fillStyle = C2; ctx.fillText(scene.tag, w / 2, h / 2 + 55);
        ctx.restore();

        const lA = Math.max(0, Math.min((sp - 0.4) * 5, 1));
        const lW = 15 + 20 * Math.max(0, Math.min((sp - 0.4) * 5, 1));
        ctx.save(); ctx.globalAlpha = lA;
        const lg = ctx.createLinearGradient(w / 2 - lW, 0, w / 2 + lW, 0);
        lg.addColorStop(0, C1); lg.addColorStop(1, C2);
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.roundRect(w / 2 - lW, h / 2 + 68, lW * 2, 3, 2); ctx.fill();
        ctx.restore();
      }
    }

    const frame = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (done) return;
      const contentTime = elapsed * SPEED;
      drawScene(Math.min(contentTime, CONTENT_DURATION));
      const pct = Math.min(elapsed / RECORD_DURATION, 1);
      setProgress(pct);
      if (elapsed < RECORD_DURATION) {
        animId = requestAnimationFrame(frame);
      } else if (!done) {
        done = true;
        setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, 200);
      }
    };

    animId = requestAnimationFrame(frame);
    return () => {
      done = true;
      cancelAnimationFrame(animId);
      try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch {}
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  const handleClose = () => navigate(localStorage.getItem('token') ? '/home' : '/');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0B0E14',
      fontFamily: "'Tajawal',sans-serif", display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      direction: 'rtl', color: '#fff',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');`}</style>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {error && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>😞</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>عذراً</h1>
          <p style={{ color: '#b0b8cc', marginBottom: 24 }}>{error}</p>
          <button onClick={handleClose}
            style={{ padding: '12px 32px', border: 'none', borderRadius: 12,
              background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            العودة للصفحة الرئيسية
          </button>
        </div>
      )}

      {!error && state === 'generating' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 36, height: 36, animation: 'sp 1s linear infinite' }}>
              <defs><linearGradient id="sg"><stop offset="0%" stopColor="#2EC4B6"/><stop offset="100%" stopColor="#BF5AF2"/></linearGradient></defs>
              <circle cx="12" cy="12" r="10" stroke="url(#sg)" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>جاري إنشاء الفيديو...</h1>
          <p style={{ color: '#8B95A5', fontSize: 15, marginBottom: 20 }}>يتم تجهيز الفيديو التعريفي خلال ثوانٍ</p>
          <div style={{
            width: 280, height: 6, borderRadius: 4,
            background: 'rgba(255,255,255,0.08)', overflow: 'hidden', margin: '0 auto',
          }}>
            <div style={{
              width: `${progress * 100}%`, height: '100%',
              background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)',
              borderRadius: 4, transition: 'width 0.2s linear',
            }} />
          </div>
          <style>{`@keyframes sp { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!error && state === 'ready' && videoUrlRef.current && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video
            src={videoUrlRef.current}
            autoPlay loop controls playsInline
            style={{ width: '100%', height: '100%', maxWidth: 1280, maxHeight: 720, objectFit: 'contain' }}
          />
          <button onClick={handleClose}
            style={{
              position: 'fixed', top: 16, left: 16, zIndex: 10,
              padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
              color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 500,
            }}>
            ✕ إغلاق
          </button>
        </div>
      )}
    </div>
  );
}
