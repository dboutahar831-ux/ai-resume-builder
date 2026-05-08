import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    title: 'Nexly',
    sub: 'AI · Career · Future',
    desc: 'منصتك الذكية لبناء السيرة الذاتية، خطابات التغطية، والتواصل المهني',
    ar: 'مرحباً بك في نيكسلي — منصة متكاملة لبناء مستقبلك المهني بالذكاء الاصطناعي',
    isLogo: true,
  },
  {
    title: 'منشئ السيرة الذاتية',
    desc: 'أنشئ سيرتك الذاتية باحترافية مع الذكاء الاصطناعي. اختر من قوالب متعددة، أضف خبراتك، واحصل على تنسيق مثالي.',
    ar: 'أنشئ سيرتك الذاتية باحترافية مع الذكاء الاصطناعي. اختر من قوالب متعددة واحصل على تنسيق مثالي',
    features: ['🤖 ذكاء اصطناعي', '📄 قوالب احترافية', '⬇️ تصدير PDF', '🌐 رابط عام'],
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2 14 8 20 8 M16 13 8 13 M16 17 8 17 M10 9 9 9 8 9',
  },
  {
    title: 'خطابات التغطية',
    desc: 'قم بإنشاء خطابات تغطية مخصصة لكل وظيفة بنقرة واحدة. اختر النغمة المناسبة ودع الذكاء الاصطناعي يكتب نيابة عنك.',
    ar: 'قم بإنشاء خطابات تغطية مخصصة لكل وظيفة بنقرة واحدة بمساعدة الذكاء الاصطناعي',
    features: ['✍️ كتابة ذكية', '🎯 مخصصة لكل وظيفة', '🎭 نغمات متعددة', '📝 حفظ وتعديل'],
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2 14 8 20 8 M9 15h6 M12 12v6',
  },
  {
    title: 'متتبع الوظائف',
    desc: 'تتبع جميع طلبات العمل الخاصة بك في لوحة واحدة. أضف ملاحظات، احفظ الوظائف المفضلة، وتابع المقابلات.',
    ar: 'تتبع جميع طلبات العمل الخاصة بك في لوحة واحدة. نظم بحثك عن العمل بذكاء',
    features: ['📊 لوحة متابعة', '⭐ حفظ الوظائف', '📅 مواعيد المقابلات', '📈 إحصائيات'],
    icon: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
  },
  {
    title: 'لوحة التحكم',
    desc: 'لوحة تحكم متكاملة تظهر لك إحصائيات سيرتك الذاتية، خطابات التغطية، وطلبات العمل في نظرة واحدة.',
    ar: 'لوحة تحكم متكاملة تظهر لك إحصائيات سيرتك الذاتية وطلبات العمل في نظرة واحدة',
    features: ['📊 رسوم بيانية', '📈 تقدم أسبوعي', '🎯 أهداف ذكية', '🔄 تحديث آني'],
    icon: 'M18 20 18 10 M12 20 12 4 M6 20 6 14',
  },
  {
    title: 'التواصل الاجتماعي',
    desc: 'تواصل مع المحترفين في مجالك، شارك منشوراتك، صور، وفيديو، وتفاعل مع المجتمع المهني.',
    ar: 'تواصل مع المحترفين في مجالك، شارك منشوراتك، وتفاعل مع المجتمع',
    features: ['❤️ تفاعلات', '💬 تعليقات', '🔄 إعادة نشر', '🏷️ هاشتاغات'],
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  },
  {
    title: 'الرسائل والمجموعات',
    desc: 'تواصل بشكل خاص مع أصدقائك وزملائك عبر الرسائل النصية، الصوتية، والصورة. أنشئ مجموعات للنقاشات الجماعية.',
    ar: 'تواصل بشكل خاص مع أصدقائك وزملائك عبر الرسائل النصية والصوتية والمجموعات',
    features: ['💬 رسائل خاصة', '👥 مجموعات', '🎤 رسائل صوتية', '😄 رموز تفاعلية'],
    icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  },
  {
    title: 'الملف الشخصي',
    desc: 'أنشئ ملفاً شخصياً احترافياً يعرض مهاراتك، خبراتك، وتعليمك. اربط حسابات LinkedIn و Google.',
    ar: 'أنشئ ملفاً شخصياً احترافياً يعرض مهاراتك وخبراتك للعالم',
    features: ['🖼️ صورة وغلاف', '🔗 ربط LinkedIn', '📋 نبذة تعريفية', '🌟 تقييم المهارات'],
    icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  },
  {
    title: '6 لغات عالمية',
    desc: 'المنصة متاحة بـ 6 لغات: العربية، الإنجليزية، الفرنسية، الإسبانية، الألمانية، والبرتغالية. اختر لغتك المفضلة.',
    ar: 'المنصة متاحة بـ 6 لغات: العربية، الإنجليزية، الفرنسية، الإسبانية، الألمانية، والبرتغالية',
    features: ['🇸🇦 العربية', '🇬🇧 English', '🇫🇷 Français', '🇪🇸 Español', '🇩🇪 Deutsch', '🇧🇷 Português'],
    icon: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z M2 12h20',
  },
  {
    title: 'انطلق الآن!',
    desc: 'انطلق في رحلتك المهنية اليوم مع Nexly. سجل مجاناً وابدأ ببناء مستقبلك المهني بالذكاء الاصطناعي.',
    ar: 'انطلق في رحلتك المهنية اليوم مع نيكسلي — سجل مجاناً وابدأ ببناء مستقبلك',
    isCTA: true,
  },
];

function LogoIcon({ small }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={small ? 'w-16 h-16' : 'w-[120px] h-[120px]'}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0%" stopColor="#2EC4B6"/><stop offset="50%" stopColor="#6C5CE7"/><stop offset="100%" stopColor="#BF5AF2"/>
        </linearGradient>
      </defs>
      <rect x="10" y="30" width="30" height="60" rx="6" fill="#2EC4B6" opacity="0.9"/>
      <rect x="45" y="15" width="30" height="90" rx="6" fill="#6C5CE7" opacity="0.85"/>
      <rect x="80" y="45" width="30" height="45" rx="6" fill="#BF5AF2" opacity="0.8"/>
    </svg>
  );
}

function SlideIcon({ path }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="url(#lg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {path.split(' M').map((seg, i) => {
        const d = (i === 0 ? '' : 'M') + seg;
        if (d.startsWith('M') && d.includes('L') || d.startsWith('M') && d.includes(' ')) {
          const parts = d.match(/[A-Z][^A-Z]*/g);
          return parts?.map((p, j) => <path key={`${i}-${j}`} d={p.trim()} />);
        }
        if (d.includes('circle')) return null;
        return <path key={i} d={d} />;
      })}
    </svg>
  );
}

export default function Promo() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const timerRef = useRef(null);
  const utteranceRef = useRef(null);
  const soundBtnRef = useRef(null);

  const speak = useCallback((text) => {
    if (!soundOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA';
    u.rate = 0.9;
    u.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arVoice) u.voice = arVoice;
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  }, [soundOn]);

  const goTo = useCallback((index) => {
    const i = Math.max(0, Math.min(SLIDES.length - 1, index));
    setCurrent(i);
    if (soundOn) {
      const ar = SLIDES[i]?.ar;
      if (ar) setTimeout(() => speak(ar), 100);
    }
  }, [soundOn, speak]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  const resetAuto = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(c => {
        if (c >= SLIDES.length - 1) return c;
        const nextIdx = c + 1;
        if (soundOn) {
          const ar = SLIDES[nextIdx]?.ar;
          if (ar) setTimeout(() => speak(ar), 100);
        }
        return nextIdx;
      });
    }, 7000);
  }, [soundOn, speak]);

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    resetAuto();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetAuto]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [next, prev]);

  useEffect(() => {
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, []);

  const toggleSound = () => {
    setSoundOn(s => {
      const next = !s;
      if (next) {
        const ar = SLIDES[current]?.ar;
        if (ar) setTimeout(() => speak(ar), 200);
      } else {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0B0E14', color: '#fff',
      fontFamily: "'Tajawal',sans-serif", overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      direction: 'rtl',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        @keyframes iconPop{0%{transform:scale(0) rotate(-10deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%{transform:translateY(100vh) rotate(0deg);opacity:0}10%{opacity:0.3}90%{opacity:0.3}100%{transform:translateY(-10vh) rotate(720deg);opacity:0}}
      `}</style>

      {/* Progress bar */}
      <div style={{position:'fixed',top:0,left:0,right:0,height:3,zIndex:30,background:'rgba(255,255,255,0.05)'}}>
        <div style={{height:'100%',width:`${((current+1)/SLIDES.length)*100}%`,background:'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)',transition:'width 0.3s linear'}} />
      </div>

      {/* Sound toggle */}
      <button onClick={toggleSound} ref={soundBtnRef} aria-label="الصوت" title="الصوت"
        style={{
          position:'fixed',top:24,right:24,zIndex:30,width:42,height:42,borderRadius:'50%',
          border:soundOn ? '1px solid #6C5CE7' : '1px solid rgba(255,255,255,0.1)',
          background:soundOn ? 'rgba(108,92,231,0.25)' : 'rgba(255,255,255,0.06)',
          backdropFilter:'blur(8px)',color:'#fff',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.3s',
        }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      </button>

      {/* Skip / Enter */}
      <button onClick={() => navigate(localStorage.getItem('token') ? '/home' : '/')}
        style={{
          position:'fixed',top:24,left:24,zIndex:30,padding:'8px 18px',borderRadius:12,
          border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.06)',
          backdropFilter:'blur(8px)',color:'#b0b8cc',cursor:'pointer',
          fontFamily:'inherit',fontSize:13,fontWeight:500,transition:'all 0.3s',
        }}>
        {localStorage.getItem('token') ? 'تخطي ← الرئيسية' : 'تخطي ← دخول'}
      </button>

      {/* Background glows */}
      <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',filter:'blur(120px)',opacity:0.12,background:'#2EC4B6',top:'-10%',left:'-5%',transition:'all 1.5s',transform:`translate(${Math.sin(current)*20}px,${Math.cos(current)*20}px)`}} />
      <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',filter:'blur(120px)',opacity:0.12,background:'#BF5AF2',bottom:'-10%',right:'-5%',transition:'all 1.5s',transform:`translate(${Math.sin(current+2)*25}px,${Math.cos(current+2)*25}px)`}} />

      {/* Particles */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:1,overflow:'hidden'}}>
        {Array.from({length:30}).map((_, i) => (
          <div key={i} style={{
            position:'absolute',width:2+Math.random()*4,height:2+Math.random()*4,
            borderRadius:'50%',background:'#6C5CE7',opacity:0.1+Math.random()*0.3,
            left:`${Math.random()*100}%`,bottom:0,
            animation:`float ${10+Math.random()*20}s linear infinite`,
            animationDelay:`${Math.random()*15}s`,
          }} />
        ))}
      </div>

      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div key={i} style={{
          position:'absolute',inset:0,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',padding:40,
          opacity:i === current ? 1 : 0,pointerEvents:i === current ? 'auto' : 'none',
          transition:'opacity 0.8s ease, transform 0.8s ease',
          transform:i === current ? 'scale(1)' : 'scale(0.92)',
          zIndex:i === current ? 2 : 1,
        }}>
          <div style={{position:'relative',zIndex:2,textAlign:'center',maxWidth:750}}>
            {slide.isLogo ? (
              <div style={{margin:'0 auto 25px',display:'flex',justifyContent:'center'}}>
                <LogoIcon />
              </div>
            ) : slide.icon ? (
              <div style={{
                width:100,height:100,borderRadius:30,
                background:'rgba(108,92,231,0.15)',border:'1px solid rgba(108,92,231,0.3)',
                display:'flex',alignItems:'center',justifyContent:'center',
                margin:'0 auto 30px',backdropFilter:'blur(10px)',
                animation:i === current ? 'iconPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
                opacity:i === current ? 1 : 0,
              }}>
                <svg viewBox="0 0 24 24" fill="none" style={{width:44,height:44}}>
                  <defs>
                    <linearGradient id={`sg${i}`} x1="0" y1="0" x2="24" y2="24">
                      <stop offset="0%" stopColor="#2EC4B6"/><stop offset="50%" stopColor="#6C5CE7"/><stop offset="100%" stopColor="#BF5AF2"/>
                    </linearGradient>
                  </defs>
                  {slide.icon.split(' M').map((seg, j) => {
                    const d = (j === 0 ? '' : 'M') + seg;
                    return <path key={j} d={d.trim()} stroke={`url(#sg${i})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />;
                  })}
                </svg>
              </div>
            ) : null}

            <h1 style={{
              fontSize:'clamp(28px,5vw,52px)',fontWeight:900,
              background:'linear-gradient(135deg,#2EC4B6,#6C5CE7,#BF5AF2)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
              backgroundClip:'text',marginBottom:16,lineHeight:1.2,
              animation:i === current ? 'fadeUp 0.6s 0.1s ease forwards' : 'none',
              opacity:i === current ? 0 : 0,
            }}>{slide.title}</h1>

            {slide.sub && (
              <p style={{color:'#6b7494',fontSize:15,fontWeight:500,letterSpacing:6,textTransform:'uppercase',marginTop:10}}>
                {slide.sub}
              </p>
            )}

            <p style={{
              fontSize:'clamp(16px,2vw,22px)',color:'#b0b8cc',lineHeight:1.7,
              fontWeight:500,maxWidth:600,margin:'0 auto',
              animation:i === current ? 'fadeUp 0.6s 0.2s ease forwards' : 'none',
              opacity:i === current ? 0 : 0,
            }}>{slide.desc}</p>

            {slide.features && (
              <div style={{display:'flex',flexWrap:'wrap',gap:12,justifyContent:'center',marginTop:30}}>
                {slide.features.map((f, j) => (
                  <span key={j} style={{
                    padding:'10px 22px',borderRadius:14,background:'rgba(255,255,255,0.06)',
                    border:'1px solid rgba(255,255,255,0.08)',fontSize:14,fontWeight:600,
                    color:'#d0d6e8',backdropFilter:'blur(4px)',
                    animation:i === current ? `fadeUp 0.5s ${0.3+j*0.05}s ease forwards` : 'none',
                    opacity:i === current ? 0 : 0,
                  }}>{f}</span>
                ))}
              </div>
            )}

            {slide.isCTA && (
              <button onClick={() => navigate(localStorage.getItem('token') ? '/home' : '/login')}
                style={{
                  marginTop:30,padding:'14px 40px',borderRadius:16,border:'none',
                  background:'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)',
                  color:'#fff',fontSize:18,fontWeight:800,cursor:'pointer',
                  fontFamily:'inherit',transition:'all 0.3s',
                  boxShadow:'0 8px 30px rgba(108,92,231,0.35)',
                  animation:i === current ? 'fadeUp 0.6s 0.3s ease forwards' : 'none',
                  opacity:i === current ? 0 : 0,
                }}
                onMouseEnter={e => {e.target.style.transform='translateY(-2px)';e.target.style.boxShadow='0 12px 40px rgba(108,92,231,0.5)'}}
                onMouseLeave={e => {e.target.style.transform='';e.target.style.boxShadow='0 8px 30px rgba(108,92,231,0.35)'}}>
                ابدأ مجاناً 🚀
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Controls */}
      <div style={{
        position:'fixed',bottom:40,left:'50%',transform:'translateX(-50%)',
        zIndex:20,display:'flex',alignItems:'center',gap:20,
      }}>
        <button onClick={prev} aria-label="السابق" style={{
          width:48,height:48,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.1)',
          background:'rgba(255,255,255,0.08)',backdropFilter:'blur(8px)',
          color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
          transition:'all 0.3s',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width:i === current ? 32 : 10,height:10,borderRadius:i === current ? 6 : '50%',
              border:'2px solid rgba(255,255,255,0.2)',
              background:i === current ? 'linear-gradient(90deg,#2EC4B6,#6C5CE7,#BF5AF2)' : 'transparent',
              borderColor:i === current ? 'transparent' : 'rgba(255,255,255,0.2)',
              cursor:'pointer',padding:0,transition:'all 0.4s ease',
            }} />
          ))}
        </div>

        <button onClick={next} aria-label="التالي" style={{
          width:48,height:48,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.1)',
          background:'rgba(255,255,255,0.08)',backdropFilter:'blur(8px)',
          color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
          transition:'all 0.3s',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
