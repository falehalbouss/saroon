// شاشات: تسجيل الدخول، OTP
const { BgDecor: _BgD, Btn: _Btn, Logo: _Logo } = window.SaroonaCommon;
const { useState: _useState0, useEffect: _useEffect0, useRef: _useRef0 } = React;

function LoginScreen({ onSubmit }) {
  const [name, setName] = _useState0('');
  const [phone, setPhone] = _useState0('');
  const [error, setError] = _useState0('');
  const [shaking, setShaking] = _useState0(false);

  const validate = () => {
    if (!name.trim()) return 'Please enter your name';
    const p = phone.replace(/\D/g, '');
    if (p.length !== 8) return 'Invalid phone number (8 digits)';
    return '';
  };

  const submit = () => {
    const e = validate();
    if (e) {
      setError(e);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    onSubmit({ name: name.trim(), phone: phone.replace(/\D/g, '') });
  };

  return (
    <div className="screen entering">
      <_BgD />
      <div className="col center" style={{ flex: 1, padding: 20, gap: 24 }}>
        <_Logo size="lg" />

        <div className={`card pop ${shaking ? 'shake' : ''}`} style={{
          padding: 28,
          background: 'var(--paper)',
          width: '100%',
          maxWidth: 420,
        }}>
          <div className="bubble-title" style={{ fontSize: 36, textAlign: 'center', marginBottom: 6 }}>
            Sign In
          </div>
          <div style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14, marginBottom: 22 }}>
            Start with Saroona in two steps 🎉
          </div>

          <div className="col gap-md">
            <div className="col" style={{ gap: 6 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', paddingLeft: 6 }}>
                Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 20 }}>👤</span>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="e.g. Mohammed"
                  style={{
                    width: '100%',
                    fontFamily: 'inherit',
                    background: 'var(--bg)',
                    border: '3px solid var(--navy)',
                    borderRadius: 'var(--r-pill)',
                    padding: '14px 20px 14px 50px',
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--navy)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div className="col" style={{ gap: 6 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', paddingLeft: 6 }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 20 }}>📱</span>
                <span style={{ position: 'absolute', left: 50, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: 'var(--ink-soft)' }}>
                  +965
                </span>
                <input
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 8)); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="5XXXXXXX"
                  inputMode="tel"
                  style={{
                    width: '100%',
                    fontFamily: 'inherit',
                    background: 'var(--bg)',
                    border: '3px solid var(--navy)',
                    borderRadius: 'var(--r-pill)',
                    padding: '14px 20px 14px 100px',
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--navy)',
                    outline: 'none',
                    letterSpacing: 1,
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="pop" style={{
                background: 'var(--primary)', color: 'white',
                padding: '10px 16px', borderRadius: 'var(--r-pill)',
                fontSize: 14, fontWeight: 700, textAlign: 'center',
                border: '2px solid var(--navy)',
              }}>
                ⚠️ {error}
              </div>
            )}

            <_Btn variant="primary" onClick={submit} style={{ fontSize: 20, padding: '16px 32px', marginTop: 6 }}>
              Continue ▸
            </_Btn>

            <div style={{ fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center', marginTop: 4 }}>
              A verification code will be sent to your phone
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OtpScreen({ phone, onVerify, onBack }) {
  const [digits, setDigits] = _useState0(['', '', '', '']);
  const [seconds, setSeconds] = _useState0(30);
  const [error, setError] = _useState0(false);
  const [verifying, setVerifying] = _useState0(false);
  const refs = [_useRef0(), _useRef0(), _useRef0(), _useRef0()];

  _useEffect0(() => {
    refs[0].current && refs[0].current.focus();
  }, []);

  _useEffect0(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError(false);
    if (v && i < 3) refs[i + 1].current && refs[i + 1].current.focus();
    if (next.every(d => d !== '')) {
      setTimeout(() => verify(next.join('')), 200);
    }
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs[i - 1].current && refs[i - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      e.preventDefault();
      setDigits(pasted.split(''));
      setTimeout(() => verify(pasted), 200);
    }
  };

  const verify = (code) => {
    setVerifying(true);
    setTimeout(() => {
      // demo: any 4 digits accepted EXCEPT 0000
      if (code === '0000') {
        setError(true);
        setVerifying(false);
        setDigits(['', '', '', '']);
        refs[0].current && refs[0].current.focus();
      } else {
        onVerify();
      }
    }, 700);
  };

  const resend = () => {
    if (seconds > 0) return;
    setSeconds(30);
    setDigits(['', '', '', '']);
    setError(false);
    refs[0].current && refs[0].current.focus();
  };

  const masked = phone ? `+965 ${phone.slice(0,1)}${'*'.repeat(Math.max(0, phone.length - 3))}${phone.slice(-2)}` : '';

  return (
    <div className="screen entering">
      <_BgD />
      <div className="col center" style={{ flex: 1, padding: 20, gap: 24 }}>
        <div className="pop" style={{
          fontSize: 80,
          filter: 'drop-shadow(4px 4px 0 var(--navy))',
        }}>📲</div>

        <div className={`card pop ${error ? 'shake' : ''}`} style={{
          padding: 28,
          background: 'var(--paper)',
          width: '100%',
          maxWidth: 420,
        }}>
          <div className="bubble-title" style={{ fontSize: 36, textAlign: 'center', marginBottom: 6 }}>
            Verification Code
          </div>
          <div style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 14, marginBottom: 4 }}>
            Enter the code sent to
          </div>
          <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--primary)', marginBottom: 22, direction: 'ltr' }}>
            {masked}
          </div>

          <div className="row gap-sm" style={{ justifyContent: 'center', direction: 'ltr', marginBottom: 18 }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                value={d}
                onChange={e => setDigit(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)}
                onPaste={handlePaste}
                inputMode="numeric"
                maxLength={1}
                style={{
                  width: 64, height: 72,
                  fontFamily: 'Lalezar, inherit',
                  background: error ? '#FFE0E8' : (d ? 'var(--accent)' : 'var(--bg)'),
                  border: '3px solid var(--navy)',
                  borderRadius: 18,
                  fontSize: 38,
                  fontWeight: 700,
                  color: 'var(--navy)',
                  textAlign: 'center',
                  outline: 'none',
                  boxShadow: '0 4px 0 0 var(--navy)',
                  transition: 'background .2s',
                }}
              />
            ))}
          </div>

          {verifying && (
            <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--accent-2)', fontWeight: 700, marginBottom: 12 }}>
              Verifying... ⏳
            </div>
          )}
          {error && (
            <div className="pop" style={{
              background: 'var(--primary)', color: 'white',
              padding: '10px 16px', borderRadius: 'var(--r-pill)',
              fontSize: 14, fontWeight: 700, textAlign: 'center',
              border: '2px solid var(--navy)',
              marginBottom: 12,
            }}>
              ⚠️ Invalid code, try again
            </div>
          )}

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)' }}>
            Didn't get the code?{' '}
            <button
              onClick={resend}
              disabled={seconds > 0}
              style={{
                background: 'transparent', border: 'none',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                color: seconds > 0 ? 'var(--ink-soft)' : 'var(--primary)',
                cursor: seconds > 0 ? 'not-allowed' : 'pointer',
                textDecoration: seconds > 0 ? 'none' : 'underline',
                padding: 0,
              }}
            >
              {seconds > 0 ? `Resend in ${seconds}s` : 'Resend'}
            </button>
          </div>
        </div>

        <_Btn variant="ghost" onClick={onBack}>◂ Change Number</_Btn>

        <div style={{ fontSize: 11, color: 'var(--ink-soft)', opacity: .7, textAlign: 'center', maxWidth: 320 }}>
          Demo version — enter any 4 digits (except 0000) to continue
        </div>
      </div>
    </div>
  );
}

window.SaroonaAuth = { LoginScreen, OtpScreen };
