import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Scene data ──────────────────────────────────────────────
const SCENES = [
  { start: 0,   end: 5,   title: 'Nexly',     sub: 'AI · Career · Future', tag: 'منصتك الذكية للمستقبل المهني', icon: 'logo' },
  { start: 5,   end: 10,  title: 'منشئ السيرة الذاتية',  tag: 'Resume Builder', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2 14 8 20 8 M16 13 8 13 M16 17 8 17' },
  { start: 10,  end: 15,  title: 'خطابات التغطية',       tag: 'Cover Letters',  icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2 14 8 20 8 M9 15h6 M12 12v6' },
  { start: 15,  end: 20,  title: 'متتبع الوظائف',        tag: 'Job Tracker',   icon: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
  { start: 20,  end: 25,  title: 'لوحة التحكم',          tag: 'Dashboard',     icon: 'M18 20 18 10 M12 20 12 4 M6 20 6 14' },
  { start: 25,  end: 30,  title: 'التواصل الاجتماعي',    tag: 'Social Feed',   icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
  { start: 30,  end: 35,  title: 'الرسائل والمجموعات',   tag: 'Messaging',     icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { start: 35,  end: 40,  title: '6 لغات عالمية',         tag: '6 Languages',   icon: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z M2 12h20' },
  { start: 40,  end: 47,  title: 'انطلق الآن',           tag: 'ابدأ مجاناً',   icon: 'cta' },
];

const DURATION = 47; // seconds
const C1 = '#2EC4B6', C2 = '#6C5CE7', C3 = '#BF5AF2';

// ─── Particle system ──────────────────────────────────────────
class Particle {
  constructor(w, h) {
    this.reset(w, h);
  }
  reset(w, h) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = 1.5 + Math.random() * 3;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3 - 0.15;
    this.opacity = 0.1 + Math.random() * 0.3;
    this.hue = Math.random() * 60 + 150; // teal-purple range
  }
  update(w, h) {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0) this.x = w;
    if (this.x > w) this.x = 0;
    if (this.y < 0) this.y = h;
    if (this.y > h) this.y = 0;
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(108,92,231,${this.opacity})`;
    ctx.fill();
  }
}

export default function Promo() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const afRef = useRef(null);
  const startRef = useRef(Date.now());
  const particlesRef = useRef([]);
  const soundRef = useRef(false);
  const utterRef = useRef(null);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      if (particlesRef.current.length === 0) {
        particlesRef.current = Array.from({ length: 50 }, () => new Particle(w, h));
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const drawBg = (t) => {
      // Animated gradient
      const t1 = t * 0.0003;
      const g = ctx.createRadialGradient(
        w * (0.5 + Math.sin(t1) * 0.3), h * (0.3 + Math.cos(t1 * 0.7) * 0.2), 0,
        w * 0.5, h * 0.5, w * 0.7
      );
      g.addColorStop(0, `hsl(${250 + Math.sin(t1) * 20}, 70%, 25%)`);
      g.addColorStop(0.5, `hsl(${270 + Math.sin(t1 * 0.5) * 15}, 60%, 15%)`);
      g.addColorStop(1, '#0B0E14');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Accent glow
      const g2 = ctx.createRadialGradient(
        w * (0.7 + Math.sin(t1 * 0.5) * 0.2), h * 0.7, 0,
        w * 0.7, h * 0.7, w * 0.4
      );
      g2.addColorStop(0, 'rgba(46,196,182,0.06)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    };

    const drawParticles = () => {
      particlesRef.current.forEach(p => {
        p.update(w, h);
        p.draw(ctx);
      });
    };

    const drawConnections = () => {
      const ps = particlesRef.current;
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x;
          const dy = ps[i].y - ps[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(ps[i].x, ps[i].y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.strokeStyle = `rgba(108,92,231,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = (ts) => {
      if (!playing) { afRef.current = requestAnimationFrame(animate); return; }
      const elapsed = (ts - startRef.current) / 1000;
      const t = elapsed % DURATION;
      setTime(t);

      ctx.clearRect(0, 0, w, h);
      drawBg(ts);
      drawParticles();
      drawConnections();
      afRef.current = requestAnimationFrame(animate);
    };

    startRef.current = Date.now();
    afRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(afRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [playing]);

  // Speech
  useEffect(() => {
    if (!soundRef.current || !window.speechSynthesis) return;
    const scene = SCENES.find(s => time >= s.start && time < s.end);
    if (scene) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(scene.title + '. ' + scene.tag);
      u.lang = 'ar-SA'; u.rate = 0.85;
      const voices = window.speechSynthesis.getVoices();
      const ar = voices.find(v => v.lang.startsWith('ar'));
      if (ar) u.voice = ar;
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    }
  }, [Math.floor(time)]);

  const toggleSound = () => {
    soundRef.current = !soundRef.current;
    if (!soundRef.current && window.speechSynthesis) window.speechSynthesis.cancel();
    if (soundRef.current) {
      if (window.speechSynthesis) window.speechSynthesis.getVoices();
    }
    // force re-render
    setTime(s => s + 0.001);
  };

  const progress = (time % DURATION) / DURATION * 100;
  const scene = SCENES.find(s => time >= s.start && time < s.end) || SCENES[0];
  const sceneProgress = scene ? (time - scene.start) / (scene.end - scene.start) : 0;
  const isLogo = scene?.icon === 'logo';
  const isCTA = scene?.icon === 'cta';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0B0E14',
      fontFamily: "'Tajawal',sans-serif", direction: 'rtl',
      overflow: 'hidden', cursor: playing ? 'none' : 'default',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');`}</style>

      {/* ── Canvas ── */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* ── Overlay content ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>

        {/* Logo scene */}
        {isLogo && (
          <div style={{ textAlign: 'center' }}>
            <svg viewBox="0 0 120 120" fill="none" style={{
              width: 80 + 40 * Math.min(sceneProgress * 2, 1), height: 80 + 40 * Math.min(sceneProgress * 2, 1),
              margin: '0 auto 25px', display: 'block',
              opacity: Math.min(sceneProgress * 3, 1),
              transform: `scale(${Math.min(sceneProgress * 2, 1)})`,
              transition: 'none',
            }}>
              <defs><linearGradient id="lgp" x1="0" y1="0" x2="120" y2="120"><stop offset="0%" stopColor="#2EC4B6"/><stop offset="50%" stopColor="#6C5CE7"/><stop offset="100%" stopColor="#BF5AF2"/></linearGradient></defs>
              <rect x="10" y="30" width="30" height="60" rx="6" fill="#2EC4B6" opacity="0.9"/>
              <rect x="45" y="15" width="30" height="90" rx="6" fill="#6C5CE7" opacity="0.85"/>
              <rect x="80" y="45" width="30" height="45" rx="6" fill="#BF5AF2" opacity="0.8"/>
            </svg>
            <h1 style={{
              fontSize: 'clamp(36px,6vw,60px)', fontWeight: 900,
              background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7,#BF5AF2)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', marginBottom: 12, letterSpacing: '-0.02em',
              opacity: Math.max(0, Math.min((sceneProgress - 0.2) * 3, 1)),
              transform: `translateY(${20 - 20 * Math.max(0, Math.min((sceneProgress - 0.2) * 5, 1))}px)`,
            }}>Nexly</h1>
            <p style={{
              color: '#6b7494', fontSize: 15, fontWeight: 500, letterSpacing: 6,
              textTransform: 'uppercase', marginBottom: 30,
              opacity: Math.max(0, Math.min((sceneProgress - 0.4) * 3, 1)),
            }}>AI · Career · Future</p>
            <p style={{
              color: '#8B95A5', fontSize: 18, fontWeight: 500,
              opacity: Math.max(0, Math.min((sceneProgress - 0.55) * 3, 1)),
            }}>منصتك الذكية لبناء المستقبل المهني</p>
          </div>
        )}

        {/* Feature scenes */}
        {!isLogo && !isCTA && (
          <div style={{ textAlign: 'center', maxWidth: 700 }}>
            {/* Icon */}
            <div style={{
              width: 100, height: 100, borderRadius: 30,
              background: `rgba(108,92,231,${0.12 + 0.08 * Math.sin(sceneProgress * Math.PI)})`,
              border: '1px solid rgba(108,92,231,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 30px',
              transform: `scale(${0.6 + 0.4 * Math.min(sceneProgress * 3, 1)}) rotate(${(1 - Math.min(sceneProgress * 3, 1)) * -10}deg)`,
              opacity: Math.min(sceneProgress * 4, 1),
              boxShadow: `0 0 ${30 + 20 * Math.sin(sceneProgress * Math.PI)}px rgba(108,92,231,0.15)`,
            }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 44, height: 44 }}>
                <defs><linearGradient id={`sg${Math.floor(time)}`} x1="0" y1="0" x2="24" y2="24"><stop offset="0%" stopColor="#2EC4B6"/><stop offset="100%" stopColor="#BF5AF2"/></linearGradient></defs>
                {scene.icon.split(' M').map((seg, j) => {
                  const d = (j === 0 ? '' : 'M') + seg;
                  return <path key={j} d={d.trim()} stroke={`url(#sg${Math.floor(time)})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />;
                })}
              </svg>
            </div>
            {/* Title */}
            <h1 style={{
              fontSize: 'clamp(28px,4.5vw,48px)', fontWeight: 900,
              background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7,#BF5AF2)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', marginBottom: 12, lineHeight: 1.3,
              opacity: Math.max(0, Math.min((sceneProgress - 0.15) * 3, 1)),
              transform: `translateY(${15 - 15 * Math.max(0, Math.min((sceneProgress - 0.15) * 5, 1))}px)`,
            }}>{scene.title}</h1>
            {/* Tag */}
            <p style={{
              color: '#6C5CE7', fontSize: 14, fontWeight: 700, letterSpacing: 3,
              textTransform: 'uppercase', marginBottom: 8,
              opacity: Math.max(0, Math.min((sceneProgress - 0.3) * 4, 1)),
            }}>{scene.tag}</p>
            {/* Decorative line */}
            <div style={{
              width: 40 + 40 * Math.max(0, Math.min((sceneProgress - 0.4) * 5, 1)),
              height: 3, borderRadius: 2,
              background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7)',
              margin: '16px auto 0',
              opacity: Math.max(0, Math.min((sceneProgress - 0.4) * 4, 1)),
            }} />
            {/* Floating particles around the icon */}
            {sceneProgress > 0.2 && (
              <div style={{ position: 'relative', marginTop: 20 }}>
                {['●', '●', '●', '●'].map((p, i) => (
                  <span key={i} style={{
                    position: 'absolute', fontSize: 4, color: [C1, C2, C3, C2][i],
                    top: -40 + Math.sin(time * 2 + i * 1.5) * 20,
                    left: `${50 + Math.cos(time * 1.5 + i * 1.8) * 30}%`,
                    opacity: 0.3 + 0.2 * Math.sin(time + i),
                    transform: `scale(${1 + 0.3 * Math.sin(time * 0.5 + i)})`,
                    transition: 'none',
                  }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA scene */}
        {isCTA && (
          <div style={{ textAlign: 'center' }}>
            <svg viewBox="0 0 120 120" fill="none" style={{
              width: 80, height: 80, margin: '0 auto 20px', display: 'block',
              opacity: Math.min(sceneProgress * 3, 1),
            }}>
              <defs><linearGradient id="lgc" x1="0" y1="0" x2="120" y2="120"><stop offset="0%" stopColor="#2EC4B6"/><stop offset="50%" stopColor="#6C5CE7"/><stop offset="100%" stopColor="#BF5AF2"/></linearGradient></defs>
              <rect x="10" y="30" width="30" height="60" rx="6" fill="#2EC4B6" opacity="0.9"/>
              <rect x="45" y="15" width="30" height="90" rx="6" fill="#6C5CE7" opacity="0.85"/>
              <rect x="80" y="45" width="30" height="45" rx="6" fill="#BF5AF2" opacity="0.8"/>
            </svg>
            <h1 style={{
              fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900,
              background: 'linear-gradient(135deg,#2EC4B6,#6C5CE7,#BF5AF2)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', marginBottom: 16,
              opacity: Math.max(0, Math.min((sceneProgress - 0.1) * 3, 1)),
              transform: `translateY(${10 - 10 * Math.max(0, Math.min((sceneProgress - 0.1) * 5, 1))}px)`,
            }}>انطلق في رحلتك المهنية</h1>
            <p style={{
              color: '#b0b8cc', fontSize: 18, fontWeight: 500, lineHeight: 1.7, maxWidth: 500, margin: '0 auto',
              opacity: Math.max(0, Math.min((sceneProgress - 0.25) * 3, 1)),
            }}>
              سجل مجاناً وابدأ ببناء مستقبلك المهني بالذكاء الاصطناعي
            </p>
            <button onClick={() => navigate(localStorage.getItem('token') ? '/home' : '/login')}
              style={{
                marginTop: 30, padding: '14px 44px', borderRadius: 16, border: 'none',
                background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)',
                color: '#fff', fontSize: 18, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.3s',
                boxShadow: '0 8px 30px rgba(108,92,231,0.35)',
                opacity: Math.max(0, Math.min((sceneProgress - 0.4) * 4, 1)),
                transform: `translateY(${20 - 20 * Math.max(0, Math.min((sceneProgress - 0.4) * 5, 1))}px)`,
              }}>
              ابدأ مجاناً 🚀
            </button>
          </div>
        )}
      </div>

      {/* ─── Progress bar ─── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 20, background: 'rgba(255,255,255,0.04)' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)',
          transition: 'width 0.1s linear',
        }} />
      </div>

      {/* ─── Controls ─── */}
      <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Sound */}
        <button onClick={toggleSound} style={{
          width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)',
          background: soundRef.current ? 'rgba(108,92,231,0.25)' : 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(8px)', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            {soundRef.current && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}
            {soundRef.current && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}
            {!soundRef.current && <line x1="23" y1="9" x2="17" y2="15"/>}
            {!soundRef.current && <line x1="17" y1="9" x2="23" y2="15"/>}
          </svg>
        </button>

        {/* Play/Pause */}
        <button onClick={() => setPlaying(p => !p)} style={{
          width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
          color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14, marginLeft: 2 }}>
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>

        {/* Skip to site */}
        <button onClick={() => navigate(localStorage.getItem('token') ? '/home' : '/')} style={{
          padding: '8px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)',
          color: '#b0b8cc', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
        }}>
          تخطي ← افتح الموقع
        </button>
      </div>

      {/* ─── Scene indicator ─── */}
      <div style={{ position: 'fixed', bottom: 85, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: 6, alignItems: 'center' }}>
        {SCENES.map((s, i) => {
          const active = scene === s;
          return (
            <div key={i} style={{
              width: active ? 28 : 7, height: 7, borderRadius: active ? 4 : '50%',
              background: active ? 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
            }} />
          );
        })}
      </div>
    </div>
  );
}
