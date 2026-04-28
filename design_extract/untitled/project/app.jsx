// التطبيق الرئيسي
const { useState, useEffect, useMemo } = React;
const { StartScreen, TeamsScreen, CategoryScreen, TEAM_PRESETS } = window.SaroonaScreens1;
const { QuestionScreen, ResultScreen, ScoreboardScreen, EndScreen } = window.SaroonaScreens2;
const { LoginScreen, OtpScreen } = window.SaroonaAuth;
const { TweaksPanel, useTweaks, TweakSection, TweakSlider, TweakRadio, TweakSelect } = window.TweaksPanel || {};

function App() {
  const tweakHook = useTweaks ? useTweaks(window.__TWEAK_DEFAULTS) : { tweaks: window.__TWEAK_DEFAULTS, setTweak: () => {} };
  const { tweaks, setTweak } = tweakHook;

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme || 'rose');
    document.body.style.fontFamily = `'${tweaks.fontFamily}', system-ui, sans-serif`;
  }, [tweaks.theme, tweaks.fontFamily]);

  const [stage, setStage] = useState('login'); // login, otp, start, teams, category, question, result, scoreboard, end
  const [user, setUser] = useState({ name: '', phone: '' });
  const [teams, setTeams] = useState([
    { ...TEAM_PRESETS[0] },
    { ...TEAM_PRESETS[1] },
  ]);
  const [scores, setScores] = useState([0, 0]);
  const [activeTeam, setActiveTeam] = useState(0);
  const [questionNum, setQuestionNum] = useState(1);
  const [currentCat, setCurrentCat] = useState(null);
  const [currentQ, setCurrentQ] = useState(null);
  const [usedQs, setUsedQs] = useState(new Set());
  const [lastResult, setLastResult] = useState({ correct: false, points: 0, multiplier: 1 });
  const [lifelines, setLifelines] = useState([
    { fifty: 2, call: 1, double: 2 },
    { fifty: 2, call: 1, double: 2 },
  ]);

  const totalQ = tweaks.totalQuestions || 20;
  const pointsPerCorrect = tweaks.pointsPerCorrect || 50;
  const timerSeconds = tweaks.timerSeconds || 60;

  const transition = (next) => {
    const cur = document.querySelector('.screen');
    if (cur) {
      cur.classList.remove('entering');
      cur.classList.add('exiting');
    setTimeout(() => setStage(next), 220);
    } else {
      setStage(next);
    }
  };

  const startGame = () => transition('teams');

  const startPlay = () => {
    setScores([0, 0]);
    setActiveTeam(0);
    setQuestionNum(1);
    setUsedQs(new Set());
    setLifelines([{ fifty: 2, call: 1, double: 2 }, { fifty: 2, call: 1, double: 2 }]);
    transition('category');
  };

  const pickCategory = (catKey) => {
    const cat = window.QUESTION_BANK[catKey];
    // pick unused question
    const available = cat.questions.filter((_, i) => !usedQs.has(`${catKey}-${i}`));
    const pool = available.length ? available : cat.questions;
    const idx = Math.floor(Math.random() * pool.length);
    const q = pool[idx];
    const realIdx = cat.questions.indexOf(q);
    setUsedQs(s => new Set([...s, `${catKey}-${realIdx}`]));
    setCurrentCat({ ...cat, key: catKey });
    setCurrentQ(q);
    transition('question');
  };

  const onAnswer = (correct, multiplier) => {
    const pts = correct ? pointsPerCorrect * multiplier : 0;
    setLastResult({ correct, points: pts, multiplier, question: currentQ });
    if (correct) {
      const next = [...scores];
      next[activeTeam] += pts;
      setScores(next);
    }
    transition('result');
  };

  const onLifeline = (kind) => {
    const next = [...lifelines];
    next[activeTeam] = { ...next[activeTeam], [kind]: next[activeTeam][kind] - 1 };
    setLifelines(next);
  };

  const continueAfterResult = () => {
    if (questionNum >= totalQ) {
      transition('end');
      return;
    }
    // كل 5 أسئلة، اعرض لوحة النقاط
    if (questionNum % 5 === 0) {
      transition('scoreboard');
    } else {
      nextTurn();
    }
  };

  const nextTurn = () => {
    setQuestionNum(n => n + 1);
    setActiveTeam(t => 1 - t);
    transition('category');
  };

  const restart = () => {
    // إعادة تعيين النقاط والحالة، ثم الرجوع لاختيار الفرق
    setScores([0, 0]);
    setQuestionNum(1);
    setActiveTeam(0);
    setUsedQs(new Set());
    setLifelines([{ fifty: 2, call: 1, double: 2 }, { fifty: 2, call: 1, double: 2 }]);
    transition('teams');
  };

  const screen = (() => {
    switch (stage) {
      case 'login': return <LoginScreen onSubmit={(u) => { setUser(u); transition('otp'); }} />;
      case 'otp': return <OtpScreen phone={user.phone} onVerify={() => transition('start')} onBack={() => transition('login')} />;
      case 'start': return <StartScreen onStart={startGame} />;
      case 'teams': return <TeamsScreen teams={teams} setTeams={setTeams} onNext={startPlay} onBack={() => transition('start')} />;
      case 'category': return <CategoryScreen activeTeam={activeTeam} teams={teams} scores={scores} questionNum={questionNum} totalQ={totalQ} onPick={pickCategory} onBack={() => transition('teams')} />;
      case 'question': return <QuestionScreen
        question={currentQ}
        category={currentCat}
        activeTeam={activeTeam}
        teams={teams}
        scores={scores}
        questionNum={questionNum}
        totalQ={totalQ}
        onAnswer={onAnswer}
        timerSeconds={timerSeconds}
        lifelinesLeft={lifelines[activeTeam]}
        onLifeline={onLifeline}
      />;
      case 'result': return <ResultScreen correct={lastResult.correct} points={lastResult.points} team={teams[activeTeam]} question={lastResult.question} onContinue={continueAfterResult} />;
      case 'scoreboard': return <ScoreboardScreen teams={teams} scores={scores} questionNum={questionNum} totalQ={totalQ} onContinue={nextTurn} />;
      case 'end': return <EndScreen teams={teams} scores={scores} onRestart={restart} />;
      default: return null;
    }
  })();

  return (
    <>
      {screen}
      {TweaksPanel && (
        <TweaksPanel title="Tweaks">
          <TweakSection title="الثيم">
            <TweakRadio
              label="لون اللعبة"
              value={tweaks.theme}
              onChange={v => setTweak('theme', v)}
              options={[
                { value: 'rose', label: 'وردي وكحلي' },
                { value: 'mint', label: 'منت ومرجاني' },
                { value: 'grape', label: 'بنفسجي' },
              ]}
            />
            <TweakSelect
              label="الخط"
              value={tweaks.fontFamily}
              onChange={v => setTweak('fontFamily', v)}
              options={[
                { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
                { value: 'Cairo', label: 'Cairo' },
                { value: 'Tajawal', label: 'Tajawal' },
              ]}
            />
          </TweakSection>
          <TweakSection title="إعدادات اللعبة">
            <TweakSlider
              label="عدد الأسئلة"
              value={tweaks.totalQuestions}
              onChange={v => setTweak('totalQuestions', v)}
              min={5} max={30} step={5}
            />
            <TweakSlider
              label="ثواني المؤقت"
              value={tweaks.timerSeconds}
              onChange={v => setTweak('timerSeconds', v)}
              min={15} max={120} step={15}
            />
            <TweakSlider
              label="نقاط الإجابة الصحيحة"
              value={tweaks.pointsPerCorrect}
              onChange={v => setTweak('pointsPerCorrect', v)}
              min={10} max={200} step={10}
            />
          </TweakSection>
        </TweaksPanel>
      )}
    </>
  );
}

const { IOSStatusBar } = window;

ReactDOM.createRoot(document.getElementById('phone-frame')).render(
  <>
    <div style={{
      width: 402, height: 874,
      borderRadius: 48,
      overflow: 'hidden',
      position: 'relative',
      background: '#000',
      boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 12px #1a1a1c, 0 0 0 14px #2a2a2e, 0 0 0 16px #0a0a0c',
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 100,
      }}/>
      {/* status bar overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 80, pointerEvents: 'none' }}>
        <IOSStatusBar dark={false}/>
      </div>
      {/* app content */}
      <div id="app" style={{ width: '100%', height: '100%', paddingTop: 54 }}>
        <App />
      </div>
      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 90,
        height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        paddingBottom: 8, pointerEvents: 'none',
      }}>
        <div style={{ width: 139, height: 5, borderRadius: 100, background: 'rgba(0,0,0,0.4)' }}/>
      </div>
    </div>
  </>
);
