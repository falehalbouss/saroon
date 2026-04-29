// شاشات: البداية، اختيار الفرق، الفئات
const { BgDecor, Btn, Logo, TeamBadge } = window.SaroonaCommon;
const { useState: _useState1 } = React;

// Modal
function Modal({ title, onClose, children, accent = 'var(--primary)', exitVariant = 'default' }) {
  const [closing, setClosing] = _useState1(false);
  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 280);
  };
  // pass closing down to children that need it
  const childrenWithProps = React.Children.map(children, c =>
    React.isValidElement(c) ? React.cloneElement(c, { closing }) : c
  );
  return (
    <div
      onClick={handleClose}
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(27,31,74,.45)',
        display: 'grid', placeItems: 'center',
        zIndex: 200, padding: '60px 16px 20px',
        animation: closing
          ? 'modalFadeOut .28s ease-in both'
          : 'modalFade .22s ease-out both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{
          background: 'var(--paper)',
          padding: 0,
          maxWidth: 560, width: '100%',
          maxHeight: '100%',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: closing
            ? `modalOut_${exitVariant} .28s cubic-bezier(.4,0,.6,1) both`
            : `modalIn_${exitVariant} .32s cubic-bezier(.22,.61,.36,1) both`,
        }}
      >
        <div style={{
          background: accent,
          color: 'white',
          padding: '18px 20px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '3px solid var(--navy)',
          gap: 12,
        }}>
          <button
            onClick={handleClose}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '3px solid var(--navy)',
              background: 'white',
              fontFamily: 'inherit', fontSize: 18, fontWeight: 700,
              cursor: 'pointer', color: 'var(--navy)',
              boxShadow: '0 3px 0 0 var(--navy)',
              flexShrink: 0,
            }}
          >✕</button>
          <div className="bubble-title" style={{ fontSize: 28, color: 'white', textShadow: '3px 3px 0 var(--navy)', textAlign: 'center', flex: 1, lineHeight: 1, paddingBottom: 4 }}>
            {title}
          </div>
          <div style={{ width: 38, flexShrink: 0 }}/>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {childrenWithProps}
        </div>
      </div>
    </div>
  );
}

function HowToPlayModal({ onClose }) {
  const rules = [
    { icon: '👥', title: 'فريقين', text: 'سمّوا فرقكم واختاروا الإيموجي واللون لكل فريق.' },
    { icon: '🎯', title: 'اختاروا فئة', text: 'كل فريق بدوره يختار فئة من 10 فئات (ثقافة، رياضة، تاريخ، وغيرها).' },
    { icon: '⏱️', title: '60 ثانية', text: 'لكم 60 ثانية للإجابة على كل سؤال. الوقت ينتهي = خسارة الدور!' },
    { icon: '🛡️', title: 'وسائل المساعدة', text: 'حذف خيارين، اتصال بصديق، ومضاعفة النقاط ×2 — استخدموها بحكمة!' },
    { icon: '⭐', title: 'النقاط', text: 'كل إجابة صحيحة = 50 نقطة (تتضاعف لو فعلتوا ×2).' },
    { icon: '🏆', title: 'الفوز', text: 'بعد 20 سؤال، الفريق صاحب أعلى نقاط هو الفائز!' },
  ];
  return (
    <Modal title="كيف ألعب؟" onClose={onClose} accent="var(--accent-2)" exitVariant="slide">
      <RulesList rules={rules} />
    </Modal>
  );
}

function RulesList({ rules, closing }) {
  const total = rules.length;
  return (
    <div className="col gap-md">
      {rules.map((r, i) => {
        const enterDelay = 0.18 + i * 0.06;
        const exitDelay = (total - 1 - i) * 0.04;
        return (
          <div key={i} className="row gap-md" style={{
            alignItems: 'center',
            padding: 12,
            background: 'var(--bg)',
            borderRadius: 16,
            border: '2px solid var(--navy)',
            gap: 12,
            animation: closing
              ? `slideOutRight .26s cubic-bezier(.4,0,.6,1) ${exitDelay}s both`
              : `slideInRight .42s cubic-bezier(.22,.61,.36,1) ${enterDelay}s both`,
          }}>
            <div style={{
              fontSize: 26, minWidth: 48, width: 48, height: 48,
              display: 'grid', placeItems: 'center',
              background: 'var(--accent)',
              border: '3px solid var(--navy)',
              borderRadius: '50%',
              boxShadow: '0 3px 0 0 var(--navy)',
              flexShrink: 0,
            }}>{r.icon}</div>
            <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{r.title}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{r.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoriesModal({ onClose }) {
  const cats = window.QUESTION_BANK;
  return (
    <Modal title="الأسئلة" onClose={onClose} accent="var(--primary)" exitVariant="pop">
      <CatsBody cats={cats} />
    </Modal>
  );
}

function CatsBody({ cats, closing }) {
  const entries = Object.entries(cats);
  const total = entries.length;
  return (
    <React.Fragment>
      <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 16, textAlign: 'center' }}>
        أكثر من <b style={{ color: 'var(--primary)' }}>{Object.values(cats).reduce((s, c) => s + c.questions.length, 0)} سؤال</b> موزّعة على {Object.keys(cats).length} فئات
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {entries.map(([k, c], i) => {
          const enterDelay = 0.2 + i * 0.04;
          const exitDelay = (total - 1 - i) * 0.025;
          return (
            <div key={k} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: 10,
              background: 'var(--bg)',
              border: '2px solid var(--navy)',
              borderRadius: 14,
              animation: closing
                ? `popOut .22s cubic-bezier(.4,0,.6,1) ${exitDelay}s both`
                : `popIn .35s cubic-bezier(.22,.61,.36,1) ${enterDelay}s both`,
            }}>
              <div style={{
                fontSize: 22, width: 38, height: 38,
                display: 'grid', placeItems: 'center',
                background: 'var(--paper)',
                border: '2px solid var(--navy)',
                borderRadius: '50%',
                flexShrink: 0,
              }}>{c.icon}</div>
              <div className="col" style={{ gap: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{c.questions.length} سؤال</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 16, padding: 10,
        background: 'var(--accent)',
        border: '2px solid var(--navy)',
        borderRadius: 14,
        textAlign: 'center',
        fontSize: 13, fontWeight: 600, color: 'var(--navy)',
        animation: closing
          ? 'popOut .2s ease-in both'
          : `popIn .3s cubic-bezier(.22,.61,.36,1) ${0.2 + total * 0.04}s both`,
      }}>
        ✦ بأنواع متعددة: اختياري، صح/خطأ، إجابة مكتوبة، صور
      </div>
    </React.Fragment>
  );
}

// شاشة البداية
function StartScreen({ onStart }) {
  const [modal, setModal] = _useState1(null);
  return (
    <div className="screen entering">
      <BgDecor />
      <div className="col center" style={{ flex: 1, gap: 40, padding: 20 }}>
        <Logo size="lg" />

        <div className="card pop" style={{
          padding: '20px 36px',
          background: 'var(--accent)',
          marginTop: 8,
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--navy)', textAlign: 'center' }}>
            🎉 تحدّى صديقك في 20 سؤال 🎉
          </div>
        </div>

        <div className="col gap-md" style={{ marginTop: 20, alignItems: 'stretch', minWidth: 260 }}>
          <Btn variant="primary" onClick={onStart} style={{ fontSize: 22, padding: '18px 48px' }}>
            ابدأ اللعب ▸
          </Btn>
          <div className="row gap-sm">
            <Btn variant="default" onClick={() => setModal('how')} style={{ flex: 1 }}>كيف ألعب</Btn>
            <Btn variant="default" onClick={() => setModal('cats')} style={{ flex: 1 }}>الأسئلة</Btn>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          bottom: 20,
          fontSize: 13,
          color: 'var(--ink-soft)',
          opacity: .6,
        }}>
          صُنعت بحب ♥ في الرياض
        </div>
      </div>
      {modal === 'how' && <HowToPlayModal onClose={() => setModal(null)} />}
      {modal === 'cats' && <CategoriesModal onClose={() => setModal(null)} />}
    </div>
  );
}

const TEAM_PRESETS = [
  { id: 't1', name: 'النمور', emoji: '🐯', color: '#FF4F8B' },
  { id: 't2', name: 'الصقور', emoji: '🦅', color: '#7C4DFF' },
  { id: 't3', name: 'الأسود', emoji: '🦁', color: '#FFC53D' },
  { id: 't4', name: 'الذئاب', emoji: '🐺', color: '#00C2A8' },
  { id: 't5', name: 'الفهود', emoji: '🐆', color: '#FF6F61' },
  { id: 't6', name: 'النسور', emoji: '🦉', color: '#5B9DFF' },
];

// شاشة اختيار الفرق
function TeamsScreen({ teams, setTeams, onNext, onBack }) {
  const update = (i, key, val) => {
    const next = [...teams];
    next[i] = { ...next[i], [key]: val };
    setTeams(next);
  };

  return (
    <div className="screen entering">
      <BgDecor />
      <div className="col" style={{ flex: 1, padding: '56px 28px 28px', gap: 24, position: 'relative', zIndex: 1 }}>
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 56 }}>
          <Btn
            variant="default"
            onClick={onBack}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              minWidth: 84,
              background: 'var(--paper)',
            }}
          >◂ رجوع</Btn>
          <div className="bubble-title" style={{ fontSize: 36, whiteSpace: 'nowrap', textAlign: 'center', flex: 1, lineHeight: 1, paddingBottom: 4 }}>اختر الفرق</div>
          <div style={{ minWidth: 84 }}/>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          flex: 1,
          alignItems: 'center',
          maxWidth: '100%',
          margin: '0 auto',
          width: '100%',
        }}>
          {teams.map((team, i) => (
            <div key={i} className="card pop" style={{
              padding: 24,
              background: team.color,
              animationDelay: `${i * 0.1}s`,
            }}>
              <div className="col gap-md" style={{ alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', opacity: .9 }}>
                  فريق {i === 0 ? 'الأول' : 'الثاني'}
                </div>
                <button
                  onClick={() => {
                    const emojis = ['🐯','🦅','🦁','🐺','🐆','🦉','🐼','🐧','🦊','🐨','🐸','🦄'];
                    const cur = emojis.indexOf(team.emoji);
                    update(i, 'emoji', emojis[(cur + 1) % emojis.length]);
                  }}
                  style={{
                    width: 110, height: 110,
                    borderRadius: '50%',
                    background: 'white',
                    border: '4px solid var(--navy)',
                    boxShadow: '0 6px 0 0 var(--navy)',
                    fontSize: 64,
                    cursor: 'pointer',
                    transition: 'transform .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'rotate(-8deg) scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0) scale(1)'}
                >
                  {team.emoji}
                </button>
                <input
                  value={team.name}
                  onChange={e => update(i, 'name', e.target.value)}
                  style={{
                    width: '100%',
                    fontFamily: 'inherit',
                    background: 'white',
                    border: '3px solid var(--navy)',
                    borderRadius: 'var(--r-pill)',
                    padding: '10px 18px',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--navy)',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <div className="row gap-sm" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['#FF4F8B','#FFC53D','#00C2A8','#7C4DFF','#FF6F61','#5B9DFF'].map(c => (
                    <button key={c}
                      onClick={() => update(i, 'color', c)}
                      style={{
                        width: 28, height: 28,
                        borderRadius: '50%',
                        background: c,
                        border: team.color === c ? '3px solid white' : '3px solid var(--navy)',
                        cursor: 'pointer',
                        boxShadow: team.color === c ? '0 0 0 2px var(--navy)' : 'none',
                      }}/>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="center" style={{ paddingBottom: 12 }}>
          <Btn variant="primary" onClick={onNext} style={{ fontSize: 22, padding: '18px 56px' }}>
            يلا نبدأ ▸
          </Btn>
        </div>
      </div>
    </div>
  );
}

// شاشة اختيار الفئة
function CategoryScreen({ activeTeam, teams, scores, questionNum, totalQ, onPick, onBack }) {
  const cats = window.QUESTION_BANK;
  const activeT = teams[activeTeam];
  return (
    <div className="screen entering">
      <BgDecor />
      <div className="col" style={{ flex: 1, padding: '56px 18px 20px', gap: 14, position: 'relative', zIndex: 1 }}>

        {/* شريط علوي: رجوع + عداد الأسئلة */}
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Btn variant="ghost" onClick={onBack} style={{ padding: '6px 12px', fontSize: 14, boxShadow: 'none', border: '2px solid var(--navy)', background: 'var(--paper)' }}>◂ رجوع</Btn>
          <div className="card" style={{ padding: '6px 14px', background: 'var(--navy)', borderColor: 'var(--navy)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'white', letterSpacing: '.5px' }}>
              السؤال <span style={{ color: 'var(--accent)', fontSize: 16 }}>{questionNum}</span> / {totalQ}
            </div>
          </div>
        </div>

        {/* صف نتائج الفريقين — مدمج */}
        <div className="row" style={{ gap: 8 }}>
          <CompactTeamCard team={teams[0]} score={scores[0]} active={activeTeam === 0} />
          <CompactTeamCard team={teams[1]} score={scores[1]} active={activeTeam === 1} />
        </div>

        {/* مؤشر الدور */}
        <div className="row center" style={{
          padding: '8px 16px',
          background: activeT.color,
          border: '3px solid var(--navy)',
          borderRadius: 999,
          alignSelf: 'center',
          boxShadow: '0 4px 0 0 var(--navy)',
          gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>{activeT.emoji}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>دور فريق {activeT.name}</span>
        </div>

        {/* العنوان + مؤشر API live */}
        <div className="col center" style={{ marginTop: 4, gap: 6 }}>
          <div className="bubble-title wobble" style={{ fontSize: 32, whiteSpace: 'nowrap' }}>
            اختر فئة
          </div>
          <div className="row" style={{
            alignItems: 'center', gap: 6,
            background: 'var(--accent-2)',
            color: 'white',
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 11, fontWeight: 700,
            border: '2px solid var(--navy)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#fff',
              animation: 'pulse 1.5s ease-in-out infinite',
              boxShadow: '0 0 0 2px rgba(255,255,255,0.4)',
            }}/>
            <span>أسئلة حيّة من الإنترنت</span>
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
          }
        `}</style>

        {/* قائمة الفئات — صفوف أفقية متناسقة */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: '100%',
        }}>
          {Object.entries(cats).map(([key, cat], i) => (
            <button key={key}
              className="card pop cat-card"
              onClick={() => onPick(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'var(--paper)',
                cursor: 'pointer',
                animationDelay: `${i * 0.04}s`,
                border: '3px solid var(--navy)',
                fontFamily: 'inherit',
                gap: 14,
                width: '100%',
                textAlign: 'right',
              }}
            >
              <div style={{
                fontSize: 32, lineHeight: 1,
                width: 52, height: 52,
                display: 'grid', placeItems: 'center',
                background: activeT.color,
                borderRadius: 14,
                border: '2px solid var(--navy)',
                flexShrink: 0,
              }}>
                {cat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--navy)', lineHeight: 1.2 }}>{cat.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2, fontWeight: 600 }}>
                  {cat.questions.length} سؤال
                </div>
              </div>
              <div style={{ fontSize: 22, color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>◂</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// بطاقة فريق مدمجة — للهيدر
function CompactTeamCard({ team, score, active }) {
  return (
    <div className="card" style={{
      flex: 1,
      padding: '8px 10px',
      background: active ? team.color : 'var(--paper)',
      borderColor: 'var(--navy)',
      transition: 'all .3s',
      transform: active ? 'scale(1.02)' : 'scale(1)',
      boxShadow: active ? '0 6px 0 0 var(--navy)' : '0 4px 0 0 var(--navy)',
    }}>
      <div className="row" style={{ alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <div className="row" style={{ alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30,
            borderRadius: '50%',
            background: active ? 'white' : team.color,
            border: '2px solid var(--navy)',
            display: 'grid', placeItems: 'center',
            fontSize: 16, flexShrink: 0,
          }}>{team.emoji}</div>
          <div style={{
            fontWeight: 700,
            fontSize: 13,
            color: active ? 'white' : 'var(--navy)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{team.name}</div>
        </div>
        <div className="bubble-title" style={{
          fontSize: 22,
          color: active ? 'white' : 'var(--accent)',
          textShadow: '2px 2px 0 var(--navy)',
          lineHeight: 1,
        }}>
          {score}
        </div>
      </div>
    </div>
  );
}

// شاشة اختيار الفئة والصعوبة قبل البدء
function SetupScreen({ selectedCat, selectedDiff, onSelectCat, onSelectDiff, onStart, onBack }) {
  const cats = window.QUESTION_BANK;
  const difficulties = [
    { key: 'easy',   name: 'سهل',    icon: '🟢', color: 'var(--accent-2)' },
    { key: 'medium', name: 'متوسط',  icon: '🟡', color: 'var(--accent)' },
    { key: 'hard',   name: 'صعب',    icon: '🔴', color: 'var(--primary)' },
    { key: 'any',    name: 'الكل',   icon: '🎲', color: 'var(--navy)' },
  ];

  // عدّ الأسئلة المتاحة للفئة + الصعوبة المختارة
  const availableCount = (() => {
    if (!selectedCat) return 0;
    const all = cats[selectedCat]?.questions || [];
    if (selectedDiff === 'any') return all.length;
    return all.filter(q => q.difficulty === selectedDiff).length;
  })();

  return (
    <div className="screen entering">
      <BgDecor />
      <div className="col" style={{ flex: 1, padding: '56px 18px 20px', gap: 16, position: 'relative', zIndex: 1, overflowY: 'auto' }}>
        <div className="row" style={{ justifyContent: 'flex-start' }}>
          <Btn variant="ghost" onClick={onBack} style={{ padding: '6px 12px', fontSize: 14, boxShadow: 'none', border: '2px solid var(--navy)', background: 'var(--paper)' }}>◂ رجوع</Btn>
        </div>

        <div className="col center" style={{ gap: 4 }}>
          <div className="bubble-title" style={{ fontSize: 30 }}>إعدادات اللعبة</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>
            اختر الفئة والصعوبة قبل ما تبدأ
          </div>
        </div>

        {/* الفئة */}
        <div className="col" style={{ gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>1. الفئة</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(cats).map(([key, cat]) => {
              const active = selectedCat === key;
              return (
                <button key={key}
                  onClick={() => onSelectCat(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: active ? 'var(--primary)' : 'var(--paper)',
                    color: active ? 'white' : 'var(--navy)',
                    border: '3px solid var(--navy)',
                    borderRadius: 'var(--r-md)',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
                    boxShadow: active ? '0 4px 0 0 var(--navy)' : '0 2px 0 0 var(--navy)',
                    transition: 'all .15s',
                  }}>
                  <div style={{
                    width: 40, height: 40, fontSize: 24,
                    display: 'grid', placeItems: 'center',
                    background: active ? 'white' : 'var(--bg)',
                    borderRadius: 12, border: '2px solid var(--navy)',
                    flexShrink: 0,
                  }}>{cat.icon}</div>
                  <div style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{cat.name}</div>
                  {active && <div style={{ fontSize: 18, fontWeight: 800 }}>✓</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* الصعوبة */}
        <div className="col" style={{ gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>2. مستوى الصعوبة</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {difficulties.map(d => {
              const active = selectedDiff === d.key;
              return (
                <button key={d.key}
                  onClick={() => onSelectDiff(d.key)}
                  style={{
                    padding: '12px 8px',
                    background: active ? d.color : 'var(--paper)',
                    color: active ? 'white' : 'var(--navy)',
                    border: '3px solid var(--navy)',
                    borderRadius: 'var(--r-md)',
                    cursor: 'pointer', fontFamily: 'inherit',
                    fontWeight: 700, fontSize: 15,
                    boxShadow: active ? '0 4px 0 0 var(--navy)' : '0 2px 0 0 var(--navy)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  <span style={{ fontSize: 16 }}>{d.icon}</span>
                  <span>{d.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* مؤشر العدد */}
        {selectedCat && (
          <div className="card center" style={{
            padding: '8px 14px',
            background: availableCount > 0 ? 'var(--accent-2)' : '#ddd',
            color: availableCount > 0 ? 'white' : 'var(--ink-soft)',
            fontWeight: 700, fontSize: 13,
          }}>
            {availableCount} سؤال متاح بهذه الإعدادات
          </div>
        )}

        {/* زر البدء */}
        <div className="row center" style={{ marginTop: 4 }}>
          <Btn
            variant="primary"
            disabled={!selectedCat || availableCount === 0}
            onClick={onStart}
            style={{ padding: '14px 36px', fontSize: 18, opacity: (!selectedCat || availableCount === 0) ? 0.5 : 1 }}
          >
            ابدأ اللعبة ▸
          </Btn>
        </div>
      </div>
    </div>
  );
}

window.SaroonaScreens1 = { StartScreen, TeamsScreen, CategoryScreen, SetupScreen, CompactTeamCard, TEAM_PRESETS };
