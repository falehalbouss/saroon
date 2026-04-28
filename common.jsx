// مكونات مساعدة لـ سارونة
const { useState, useEffect, useRef, useMemo } = React;

// خلفية زخرفية
function BgDecor() {
  const blobs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 80 + Math.random() * 140,
    color: ['var(--primary)', 'var(--accent)', 'var(--accent-2)'][i % 3],
    delay: Math.random() * 4,
  })), []);
  const stars = useMemo(() => ['✦', '✧', '★', '✩', '❋', '✿'].flatMap((s, i) =>
    Array.from({ length: 3 }, (_, j) => ({
      id: `${i}-${j}`,
      char: s,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      size: 18 + Math.random() * 24,
    }))
  ), []);
  return (
    <div className="bg-decor">
      {blobs.map(b => (
        <div key={b.id} className="blob" style={{
          left: `${b.left}%`, top: `${b.top}%`,
          width: b.size, height: b.size,
          background: b.color,
          animationDelay: `${b.delay}s`,
          opacity: .25,
        }}/>
      ))}
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.left}%`, top: `${s.top}%`,
          fontSize: s.size,
          animationDelay: `${s.delay}s`,
          color: 'var(--primary)',
        }}>{s.char}</div>
      ))}
    </div>
  );
}

// زر كرتوني
function Btn({ children, variant = 'default', onClick, style, className = '', disabled }) {
  const cls = `btn ${variant === 'primary' ? 'btn-primary' : variant === 'accent' ? 'btn-accent' : variant === 'ghost' ? 'btn-ghost' : ''} ${className}`;
  return (
    <button className={cls} onClick={onClick} style={style} disabled={disabled}>
      {children}
    </button>
  );
}

// شعار سارونة
function Logo({ size = 'lg' }) {
  const fs = size === 'lg' ? 'clamp(64px, 11vw, 140px)' : size === 'md' ? '48px' : '32px';
  return (
    <div className="col center" style={{ position: 'relative' }}>
      <div className="bubble-title sway" style={{ fontSize: fs, fontFamily: 'Lalezar' }}>
        سارونة
      </div>
      {size === 'lg' && (
        <div style={{
          fontSize: 22,
          color: 'var(--ink-soft)',
          fontWeight: 600,
          marginTop: 12,
          letterSpacing: 1,
        }}>
          ◆ لعبة الأسئلة ◆
        </div>
      )}
    </div>
  );
}

// الكونفيتي
function fireConfetti() {
  const colors = ['#FF4F8B', '#FFC53D', '#00C2A8', '#7C4DFF', '#FF66C4'];
  const root = document.getElementById('app');
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * .5}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.5}s`;
    piece.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    root.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

// شارة فريق
function TeamBadge({ team, score, active, side = 'right' }) {
  return (
    <div className="card" style={{
      padding: '14px 20px',
      minWidth: 180,
      background: active ? team.color : 'var(--paper)',
      borderColor: 'var(--navy)',
      transition: 'all .3s',
      transform: active ? 'scale(1.05)' : 'scale(1)',
    }}>
      <div className="row gap-md" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="row gap-sm" style={{ alignItems: 'center' }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: '50%',
            background: active ? 'white' : team.color,
            border: '3px solid var(--navy)',
            display: 'grid', placeItems: 'center',
            fontSize: 24,
          }}>{team.emoji}</div>
          <div className="col" style={{ alignItems: 'flex-start' }}>
            <div style={{ fontSize: 12, opacity: .7, fontWeight: 600, color: active ? 'white' : 'var(--ink-soft)' }}>فريق</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: active ? 'white' : 'var(--navy)' }}>{team.name}</div>
          </div>
        </div>
        <div className="bubble-title" style={{
          fontSize: 36,
          color: active ? 'white' : 'var(--accent)',
          textShadow: active ? '2px 2px 0 var(--navy)' : '2px 2px 0 var(--navy)',
        }}>
          {score}
        </div>
      </div>
    </div>
  );
}

window.SaroonaCommon = { BgDecor, Btn, Logo, fireConfetti, TeamBadge };
