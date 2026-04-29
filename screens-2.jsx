// شاشات: السؤال، النتيجة، لوحة النقاط، النهاية
const { BgDecor, Btn, Logo, fireConfetti, TeamBadge } = window.SaroonaCommon;
const { CompactTeamCard } = window.SaroonaScreens1;
const { useState, useEffect, useRef } = React;

// شاشة السؤال
function QuestionScreen({ question, category, activeTeam, teams, scores, questionNum, totalQ, onAnswer, timerSeconds = 60, lifelinesLeft, onLifeline }) {
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [textAnswer, setTextAnswer] = useState('');
  const [hidden, setHidden] = useState([]); // hidden mcq options
  const [doubled, setDoubled] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setTimeout(() => onAnswer(false, 0), 200);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const submit = (correct) => {
    clearInterval(intervalRef.current);
    onAnswer(correct, doubled ? 2 : 1);
  };

  const checkText = () => {
    const norm = textAnswer.trim().toLowerCase();
    const ok = question.answer.some(a => a.toLowerCase() === norm);
    submit(ok);
  };

  const useLifeline = (kind) => {
    if (!lifelinesLeft[kind]) return;
    onLifeline(kind);
    if (kind === 'double') setDoubled(true);
    if (kind === 'fifty' && question.type === 'mcq') {
      const wrongs = question.options.map((_, i) => i).filter(i => i !== question.answer);
      const shuffled = wrongs.sort(() => Math.random() - .5);
      setHidden(shuffled.slice(0, 2));
    }
    if (kind === 'call') {
      setShowCall(true);
      setTimeout(() => setShowCall(false), 4000);
    }
  };

  const timerColor = timeLeft <= 10 ? 'var(--primary)' : timeLeft <= 20 ? 'var(--accent)' : 'var(--accent-2)';
  const timerPct = (timeLeft / timerSeconds) * 100;

  return (
    <div className="screen entering">
      <BgDecor />
      <div className="col" style={{ flex: 1, padding: '56px 14px 14px', gap: 10, position: 'relative', zIndex: 1 }}>

        {/* صف 1: عداد الأسئلة + المؤقت */}
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div className="card" style={{ padding: '6px 14px', background: 'var(--navy)', borderColor: 'var(--navy)', boxShadow: 'none' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'white', letterSpacing: '.5px' }}>
              السؤال <span style={{ color: 'var(--accent)', fontSize: 16 }}>{questionNum}</span> / {totalQ}
            </div>
          </div>

          <div style={{
            width: 64, height: 64,
            borderRadius: '50%',
            background: 'var(--paper)',
            border: '4px solid var(--navy)',
            boxShadow: '0 4px 0 0 var(--navy)',
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
            animation: timeLeft <= 10 ? 'pulse-timer .5s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }}>
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="6"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke={timerColor} strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - timerPct/100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}/>
            </svg>
            <div className="bubble-title" style={{ fontSize: 22, color: timerColor }}>
              {timeLeft}
            </div>
          </div>
        </div>

        {/* صف 2: بطاقتا الفريقين */}
        <div className="row" style={{ gap: 8 }}>
          <CompactTeamCard team={teams[0]} score={scores[0]} active={activeTeam === 0} />
          <CompactTeamCard team={teams[1]} score={scores[1]} active={activeTeam === 1} />
        </div>

        {/* Category badge */}
        <div className="center">
          <div className="card" style={{
            padding: '8px 20px',
            background: 'var(--accent)',
            display: 'inline-flex',
            gap: 8,
            alignItems: 'center',
            fontWeight: 700,
            fontSize: 16,
          }}>
            <span style={{ fontSize: 22 }}>{category.icon}</span>
            <span>{category.name}</span>
            {doubled && <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: 999, fontSize: 13 }}>×2</span>}
          </div>
        </div>

        {/* Question */}
        <div className="card pop" style={{
          padding: '20px 18px',
          background: 'var(--paper)',
          maxWidth: '100%',
          margin: '0 auto',
          width: '100%',
        }}>
          {question.type === 'image' && (
            <div className="center" style={{
              fontSize: 56,
              marginBottom: 10,
              filter: 'drop-shadow(3px 3px 0 var(--navy))',
            }}>{question.emoji}</div>
          )}
          <div dir="auto" style={{
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: 700,
            textAlign: 'center',
            color: 'var(--navy)',
            lineHeight: 1.4,
          }}>
            {question.q}
          </div>
        </div>

        {/* Answer area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '100%', margin: '0 auto', width: '100%' }}>
          {(question.type === 'mcq' || question.type === 'image') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              {question.options.map((opt, i) => (
                <button key={i}
                  className="card"
                  disabled={hidden.includes(i)}
                  onClick={() => submit(i === question.answer)}
                  style={{
                    padding: '12px 16px',
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    background: hidden.includes(i) ? '#ddd' : 'var(--paper)',
                    color: hidden.includes(i) ? '#999' : 'var(--navy)',
                    cursor: hidden.includes(i) ? 'not-allowed' : 'pointer',
                    opacity: hidden.includes(i) ? .35 : 1,
                    transition: 'all .2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                  onMouseEnter={e => { if (!hidden.includes(i)) { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; } }}
                  onMouseLeave={e => { if (!hidden.includes(i)) { e.currentTarget.style.background = 'var(--paper)'; e.currentTarget.style.color = 'var(--navy)'; } }}
                >
                  <span style={{
                    display: 'inline-grid', placeItems: 'center',
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    border: '2px solid var(--navy)',
                    fontSize: 14,
                    flexShrink: 0,
                  }}>{['أ','ب','ج','د'][i]}</span>
                  <span dir="auto" style={{ flex: 1, textAlign: 'start' }}>{opt}</span>
                </button>
              ))}
            </div>
          )}

          {question.type === 'tf' && (
            <div className="row gap-md" style={{ justifyContent: 'center' }}>
              <button className="card"
                onClick={() => submit(question.answer === true)}
                style={{ padding: '24px 32px', background: 'var(--accent-2)', color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: 22, cursor: 'pointer', flex: 1 }}>
                ✓ صح
              </button>
              <button className="card"
                onClick={() => submit(question.answer === false)}
                style={{ padding: '24px 32px', background: 'var(--primary)', color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: 22, cursor: 'pointer', flex: 1 }}>
                ✗ خطأ
              </button>
            </div>
          )}

          {question.type === 'text' && (
            <div className="col gap-md" style={{ alignItems: 'center' }}>
              <input
                dir="auto"
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkText()}
                placeholder="اكتب إجابتك هنا..."
                style={{
                  width: '100%',
                  maxWidth: 500,
                  fontFamily: 'inherit',
                  background: 'var(--paper)',
                  border: '3px solid var(--navy)',
                  borderRadius: 'var(--r-pill)',
                  padding: '16px 24px',
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--navy)',
                  textAlign: 'center',
                  outline: 'none',
                }}
                autoFocus
              />
              <Btn variant="primary" onClick={checkText} disabled={!textAnswer.trim()}>
                تأكيد ▸
              </Btn>
            </div>
          )}
        </div>

        {/* Lifelines */}
        <div className="row gap-sm" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => useLifeline('fifty')} disabled={!lifelinesLeft.fifty || question.type !== 'mcq'}
            className="card"
            style={{
              padding: '8px 16px', fontFamily: 'inherit', fontWeight: 700,
              background: lifelinesLeft.fifty ? 'var(--paper)' : '#eee',
              opacity: lifelinesLeft.fifty ? 1 : .4,
              cursor: lifelinesLeft.fifty ? 'pointer' : 'not-allowed',
              fontSize: 14,
            }}>
            ✂️ حذف خيارين ({lifelinesLeft.fifty})
          </button>
          <button onClick={() => useLifeline('call')} disabled={!lifelinesLeft.call}
            className="card"
            style={{
              padding: '8px 16px', fontFamily: 'inherit', fontWeight: 700,
              background: lifelinesLeft.call ? 'var(--paper)' : '#eee',
              opacity: lifelinesLeft.call ? 1 : .4,
              cursor: lifelinesLeft.call ? 'pointer' : 'not-allowed',
              fontSize: 14,
            }}>
            📞 اتصل بصديق ({lifelinesLeft.call})
          </button>
          <button onClick={() => useLifeline('double')} disabled={!lifelinesLeft.double || doubled}
            className="card"
            style={{
              padding: '8px 16px', fontFamily: 'inherit', fontWeight: 700,
              background: doubled ? 'var(--primary)' : (lifelinesLeft.double ? 'var(--paper)' : '#eee'),
              color: doubled ? 'white' : 'var(--navy)',
              opacity: lifelinesLeft.double ? 1 : .4,
              cursor: lifelinesLeft.double ? 'pointer' : 'not-allowed',
              fontSize: 14,
            }}>
            ✦ ×2 نقاط ({lifelinesLeft.double})
          </button>
        </div>

        {/* Call popup */}
        {showCall && (
          <div className="card pop" style={{
            position: 'absolute',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: 16,
            background: 'var(--accent-2)',
            color: 'white',
            maxWidth: 360,
            zIndex: 50,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>📞 صديقك يقول:</div>
            <div style={{ fontSize: 14 }}>
              "أعتقد إن الإجابة هي <b>{
                question.type === 'mcq' || question.type === 'image' ? question.options[question.answer] :
                question.type === 'tf' ? (question.answer ? 'صح' : 'خطأ') :
                Array.isArray(question.answer) ? question.answer[0] : question.answer
              }</b>... بس مو متأكد 100%! 😅"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// شاشة نتيجة السؤال
function ResultScreen({ correct, points, team, question, onContinue }) {
  useEffect(() => {
    if (correct) fireConfetti();
    const t = setTimeout(onContinue, correct ? 2400 : 3600);
    return () => clearTimeout(t);
  }, []);

  // استخراج الإجابة الصحيحة بشكل قابل للعرض
  const correctAnswerText = (() => {
    if (!question) return null;
    if (question.type === 'mcq' || question.type === 'image') {
      return question.options?.[question.answer];
    }
    if (question.type === 'tf') {
      return question.answer ? 'صح ✓' : 'خطأ ✗';
    }
    if (question.type === 'text') {
      return Array.isArray(question.answer) ? question.answer[0] : question.answer;
    }
    return null;
  })();

  return (
    <div className="screen entering">
      <BgDecor />
      <div className="col center" style={{ flex: 1, gap: 20, padding: '20px 24px' }}>
        <div className="pop" style={{
          fontSize: 140,
          lineHeight: 1,
          filter: `drop-shadow(6px 6px 0 var(--navy))`,
        }}>
          {correct ? '🎉' : '😅'}
        </div>
        <div className="bubble-title" style={{
          fontSize: 56,
          color: correct ? 'var(--accent-2)' : 'var(--primary)',
          textAlign: 'center',
          lineHeight: 1.1,
          padding: '0 8px',
          maxWidth: '100%',
        }}>
          {correct ? 'إجابة صحيحة!' : 'إجابة خاطئة'}
        </div>
        {correct && (
          <div className="card pop" style={{
            padding: '12px 22px',
            background: 'var(--accent)',
            fontSize: 18,
            fontWeight: 700,
            animationDelay: '.3s',
            textAlign: 'center',
            maxWidth: '100%',
          }}>
            +{points} نقطة لـ {team.name} {team.emoji}
          </div>
        )}
        {!correct && correctAnswerText && (
          <div className="card pop" style={{
            padding: '14px 24px',
            background: 'var(--paper)',
            border: '3px solid var(--accent-2)',
            animationDelay: '.4s',
            textAlign: 'center',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>
              الإجابة الصحيحة
            </div>
            <div dir="auto" style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--accent-2)',
              lineHeight: 1.3,
              textWrap: 'pretty',
            }}>
              {correctAnswerText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// لوحة النقاط بين الجولات
function ScoreboardScreen({ teams, scores, questionNum, totalQ, onContinue }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 3000);
    return () => clearTimeout(t);
  }, []);
  const max = Math.max(...scores, 100);
  return (
    <div className="screen entering">
      <BgDecor />
      <div className="col center" style={{ flex: 1, gap: 32, padding: 32 }}>
        <div className="bubble-title" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
          لوحة النقاط
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-soft)' }}>
          أكملنا {questionNum} من {totalQ} سؤال
        </div>

        <div className="col gap-md" style={{ width: '100%', maxWidth: 600 }}>
          {teams.map((team, i) => (
            <div key={i} className="card pop" style={{
              padding: '20px 24px',
              background: 'var(--paper)',
              animationDelay: `${i * 0.2}s`,
            }}>
              <div className="row" style={{ alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 40 }}>{team.emoji}</div>
                <div style={{ flex: 1, fontSize: 22, fontWeight: 700 }}>{team.name}</div>
                <div className="bubble-title" style={{ fontSize: 36, color: team.color }}>
                  {scores[i]}
                </div>
              </div>
              <div style={{
                height: 18,
                background: '#eee',
                borderRadius: 999,
                border: '2px solid var(--navy)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(scores[i] / max) * 100}%`,
                  height: '100%',
                  background: team.color,
                  transition: 'width 1.2s cubic-bezier(.34,1.56,.64,1)',
                  borderLeft: '2px solid var(--navy)',
                }}/>
              </div>
            </div>
          ))}
        </div>

        <Btn variant="primary" onClick={onContinue}>تابع ▸</Btn>
      </div>
    </div>
  );
}

// شاشة النهاية
function EndScreen({ teams, scores, onRestart }) {
  const winner = scores[0] === scores[1] ? null : (scores[0] > scores[1] ? 0 : 1);
  useEffect(() => {
    if (winner !== null) fireConfetti();
  }, []);
  return (
    <div className="screen entering">
      <BgDecor />
      <div className="col center" style={{ flex: 1, gap: 24, padding: 32 }}>
        <div className="bubble-title" style={{ fontSize: 'clamp(48px, 8vw, 88px)' }}>
          {winner === null ? 'تعـادل!' : 'الفـائـز!'}
        </div>

        {winner !== null ? (
          <div className="card pop" style={{
            padding: '32px 48px',
            background: teams[winner].color,
            color: 'white',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'clamp(80px, 12vw, 140px)' }}>{teams[winner].emoji}</div>
            <div style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, marginTop: 8 }}>
              {teams[winner].name}
            </div>
            <div className="bubble-title" style={{ fontSize: 64, color: 'var(--accent)', marginTop: 8 }}>
              {scores[winner]} نقطة
            </div>
          </div>
        ) : (
          <div className="row gap-md">
            {teams.map((t, i) => (
              <div key={i} className="card pop" style={{ padding: 24, background: t.color, color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: 80 }}>{t.emoji}</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{t.name}</div>
                <div className="bubble-title" style={{ fontSize: 48, color: 'var(--accent)' }}>{scores[i]}</div>
              </div>
            ))}
          </div>
        )}

        <div className="row gap-sm" style={{ marginTop: 12 }}>
          <Btn variant="primary" onClick={onRestart} style={{ fontSize: 20 }}>🔁 العب مرة ثانية</Btn>
        </div>
      </div>
    </div>
  );
}

window.SaroonaScreens2 = { QuestionScreen, ResultScreen, ScoreboardScreen, EndScreen };
