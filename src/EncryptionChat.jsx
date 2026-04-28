import React, { useState, useRef, useEffect } from 'react';
import './EncryptionChat.css';

/* ─── Cipher Implementations ──────────────────────────────────── */

const caesarEncrypt = (text, key) => {
  const shift = parseInt(key) || 0;
  return text.toUpperCase().split('').map(ch =>
    ch >= 'A' && ch <= 'Z'
      ? String.fromCharCode((ch.charCodeAt(0) - 65 + shift) % 26 + 65)
      : ch
  ).join('');
};

const caesarDecrypt = (text, key) => {
  const shift = parseInt(key) || 0;
  return text.toUpperCase().split('').map(ch =>
    ch >= 'A' && ch <= 'Z'
      ? String.fromCharCode((ch.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
      : ch
  ).join('');
};

const vigenereEncrypt = (text, key) => {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!k) return text.toUpperCase();
  let ki = 0;
  return text.toUpperCase().split('').map(ch => {
    if (ch >= 'A' && ch <= 'Z') {
      const s = k[ki++ % k.length].charCodeAt(0) - 65;
      return String.fromCharCode((ch.charCodeAt(0) - 65 + s) % 26 + 65);
    }
    return ch;
  }).join('');
};

const vigenereDecrypt = (text, key) => {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!k) return text.toUpperCase();
  let ki = 0;
  return text.toUpperCase().split('').map(ch => {
    if (ch >= 'A' && ch <= 'Z') {
      const s = k[ki++ % k.length].charCodeAt(0) - 65;
      return String.fromCharCode((ch.charCodeAt(0) - 65 - s + 26) % 26 + 65);
    }
    return ch;
  }).join('');
};

const railFenceEncrypt = (text, key) => {
  const rails = Math.max(parseInt(key) || 3, 2);
  const fence = Array.from({ length: rails }, () => []);
  let rail = 0, dir = 1;
  for (const ch of text) {
    fence[rail].push(ch);
    rail += dir;
    if (rail === 0 || rail === rails - 1) dir *= -1;
  }
  return fence.flat().join('').toUpperCase();
};

const railFenceDecrypt = (text, key) => {
  const rails = Math.max(parseInt(key) || 3, 2);
  const fence = Array.from({ length: rails }, () => []);
  let rail = 0, dir = 1;
  for (let i = 0; i < text.length; i++) {
    fence[rail].push(null);
    rail += dir;
    if (rail === 0 || rail === rails - 1) dir *= -1;
  }
  let idx = 0;
  for (let r = 0; r < rails; r++)
    for (let c = 0; c < fence[r].length; c++)
      if (fence[r][c] === null) fence[r][c] = text[idx++];
  let result = '';
  rail = 0; dir = 1;
  for (let i = 0; i < text.length; i++) {
    result += fence[rail].shift();
    rail += dir;
    if (rail === 0 || rail === rails - 1) dir *= -1;
  }
  return result.toUpperCase();
};

const buildPlayfairMatrix = (key) => {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const seen = new Set();
  const mat = [];
  for (const c of k + 'ABCDEFGHIKLMNOPQRSTUVWXYZ')
    if (!seen.has(c)) { seen.add(c); mat.push(c); }
  return mat;
};

const playfairEncrypt = (text, key) => {
  const mat = buildPlayfairMatrix(key);
  const t = text.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const dg = [];
  let i = 0;
  while (i < t.length) {
    let a = t[i++];
    let b = i < t.length && t[i] !== a ? t[i++] : 'X';
    dg.push([a, b]);
  }
  return dg.map(([a, b]) => {
    const pA = mat.indexOf(a), pB = mat.indexOf(b);
    const rA = Math.floor(pA / 5), cA = pA % 5;
    const rB = Math.floor(pB / 5), cB = pB % 5;
    if (rA === rB) return mat[rA * 5 + (cA + 1) % 5] + mat[rB * 5 + (cB + 1) % 5];
    if (cA === cB) return mat[((rA + 1) % 5) * 5 + cA] + mat[((rB + 1) % 5) * 5 + cB];
    return mat[rA * 5 + cB] + mat[rB * 5 + cA];
  }).join('');
};

const playfairDecrypt = (text, key) => {
  const mat = buildPlayfairMatrix(key);
  const t = text.toUpperCase().replace(/[^A-Z]/g, '');
  const dg = [];
  for (let i = 0; i < t.length; i += 2) dg.push([t[i], t[i + 1]]);
  return dg.map(([a, b]) => {
    const pA = mat.indexOf(a), pB = mat.indexOf(b);
    const rA = Math.floor(pA / 5), cA = pA % 5;
    const rB = Math.floor(pB / 5), cB = pB % 5;
    if (rA === rB) return mat[rA * 5 + (cA + 4) % 5] + mat[rB * 5 + (cB + 4) % 5];
    if (cA === cB) return mat[((rA + 4) % 5) * 5 + cA] + mat[((rB + 4) % 5) * 5 + cB];
    return mat[rA * 5 + cB] + mat[rB * 5 + cA];
  }).join('');
};

const ENCRYPT = {
  caesar: caesarEncrypt,
  vigenere: vigenereEncrypt,
  railfence: railFenceEncrypt,
  playfair: playfairEncrypt,
};

const DECRYPT = {
  caesar: caesarDecrypt,
  vigenere: vigenereDecrypt,
  railfence: railFenceDecrypt,
  playfair: playfairDecrypt,
};

/* ─── Cipher Config ───────────────────────────────────────────── */
const CIPHERS = [
  { value: 'caesar',    label: 'Caesar',     desc: 'Shift by numeric key'         },
  { value: 'vigenere',  label: 'Vigenère',   desc: 'Repeating keyword shifts'      },
  { value: 'railfence', label: 'Rail Fence', desc: 'Zigzag rail transposition'     },
  { value: 'playfair',  label: 'Playfair',   desc: 'Digraph substitution (5×5)'    },
];

const NUMERIC_CIPHERS = ['caesar', 'railfence'];

/* ─── Main Component ──────────────────────────────────────────── */
const EncryptionChat = () => {
  const [messages,    setMessages]    = useState([]);
  const [inputMsg,    setInputMsg]    = useState('');
  const [cipher,      setCipher]      = useState('caesar');
  const [key,         setKey]         = useState('');
  const [currentUser, setCurrentUser] = useState('User A');
  const [mode,        setMode]        = useState('encrypt');

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const keyPlaceholder = NUMERIC_CIPHERS.includes(cipher)
    ? 'Numeric key  (e.g. 3)'
    : 'Keyword  (e.g. SECRET)';

  const handleSend = () => {
    const msg  = inputMsg.trim();
    const kval = key.trim();
    if (!msg || !kval) {
      alert(`Please fill in both the message and the ${mode}ion key.`);
      return;
    }
    
    let encrypted, decrypted;
    if (mode === 'encrypt') {
      encrypted = ENCRYPT[cipher](msg, kval);
      decrypted = DECRYPT[cipher](encrypted, kval);
    } else {
      decrypted = DECRYPT[cipher](msg, kval);
      encrypted = msg.toUpperCase();
    }

    setMessages(prev => [...prev, {
      id:        Date.now(),
      sender:    currentUser,
      type:      currentUser === 'User A' ? 'sent' : 'received',
      original:  mode === 'encrypt' ? msg.toUpperCase() : decrypted,
      encrypted,
      decrypted,
      cipher,
      key:       kval,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }]);

    setInputMsg('');
    setCurrentUser(u => u === 'User A' ? 'User B' : 'User A');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
  };

  const cipherLabel = CIPHERS.find(c => c.value === cipher)?.label ?? cipher;

  return (
    <div className="ec-app">

      {/* ── Navbar ── */}
      <nav className="ec-navbar">
        <div className="ec-navbar-brand">
          <div className="ec-navbar-icon">🔐</div>
          <div>
            <div className="ec-navbar-title">CipherChat</div>
            <div className="ec-navbar-sub">Classical Cipher Encryption Lab</div>
          </div>
        </div>
        <div className="ec-navbar-meta">
          <span className="ec-status-dot">SECURE</span>
          <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
        </div>
      </nav>

      {/* ── Layout ── */}
      <div className="ec-layout">

        {/* Cipher selector */}
        <div className="ec-cipher-bar">
          {CIPHERS.map(c => (
            <button
              key={c.value}
              id={`cipher-${c.value}`}
              className={`ec-cipher-btn ${cipher === c.value ? 'active' : ''}`}
              onClick={() => setCipher(c.value)}
            >
              <span className="ec-cipher-btn-name">{c.label}</span>
              <span className="ec-cipher-btn-desc">{c.desc}</span>
            </button>
          ))}
        </div>

        {/* Messages area */}
        <div className="ec-messages-wrap">
          <div className="ec-messages-scroll" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="ec-empty">
                <div className="ec-empty-icon">🔏</div>
                <div className="ec-empty-title">No messages yet</div>
                <div className="ec-empty-sub">
                  Select a cipher, enter your key,<br />
                  and send an encrypted message below.
                </div>
              </div>
            ) : (
              <div className="ec-messages-list">
                {messages.map(m => (
                  <div key={m.id} className={`ec-msg ${m.type}`}>

                    {/* Header */}
                    <div className="ec-msg-head">
                      <div className="ec-msg-sender">
                        <div className="ec-msg-avatar">
                          {m.sender === 'User A' ? 'A' : 'B'}
                        </div>
                        <span className="ec-msg-sender-name">{m.sender}</span>
                      </div>
                      <div className="ec-msg-meta">
                        <span className="ec-msg-cipher-badge">
                          {CIPHERS.find(c => c.value === m.cipher)?.label}
                        </span>
                        <span className="ec-msg-time">{m.timestamp}</span>
                      </div>
                    </div>

                    {/* Data grid */}
                    <div className="ec-msg-body">
                      <div className="ec-data-cell">
                        <div className="ec-data-label original">Plaintext</div>
                        <div className="ec-data-value">{m.original}</div>
                      </div>
                      <div className="ec-data-cell">
                        <div className="ec-data-label encrypted">Ciphertext</div>
                        <div className="ec-data-value">{m.encrypted}</div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="ec-msg-foot">
                      KEY: <span>{m.key}</span>
                      &nbsp;·&nbsp;
                      DECRYPTED: <span>{m.decrypted}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input panel */}
        <div className="ec-input-panel">

          {/* User toggle + key row */}
          <div className="ec-controls-row">
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="ec-user-toggle">
                <button
                  id="toggle-user-a"
                  className={`ec-user-btn ${currentUser === 'User A' ? 'active-a' : ''}`}
                  onClick={() => setCurrentUser('User A')}
                >
                  User A
                </button>
                <button
                  id="toggle-user-b"
                  className={`ec-user-btn ${currentUser === 'User B' ? 'active-b' : ''}`}
                  onClick={() => setCurrentUser('User B')}
                >
                  User B
                </button>
              </div>

              <div className="ec-user-toggle">
                <button
                  id="toggle-mode-encrypt"
                  className={`ec-user-btn ${mode === 'encrypt' ? 'active-mode' : ''}`}
                  onClick={() => setMode('encrypt')}
                >
                  Encrypt
                </button>
                <button
                  id="toggle-mode-decrypt"
                  className={`ec-user-btn ${mode === 'decrypt' ? 'active-mode' : ''}`}
                  onClick={() => setMode('decrypt')}
                >
                  Decrypt
                </button>
              </div>
            </div>

            <div className="ec-key-wrap">
              <span className="ec-key-label">KEY</span>
              <input
                id="encryption-key"
                type="text"
                className="ec-key-field"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder={keyPlaceholder}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Message + send row */}
          <div className="ec-send-row">
            <div className="ec-msg-field-wrap">
              <input
                id="message-input"
                type="text"
                className="ec-msg-field"
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Type a message to ${mode} with ${cipherLabel}…`}
                autoComplete="off"
              />
            </div>

            <button
              id="send-button"
              className="ec-send-btn"
              onClick={handleSend}
              disabled={!inputMsg.trim() || !key.trim()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round">
                {mode === 'encrypt' ? (
                  <>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </>
                ) : (
                  <>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </>
                )}
              </svg>
              {mode === 'encrypt' ? 'Encrypt & Send' : 'Decrypt & Send'}
            </button>
          </div>

        </div>
      </div>

      {/* Status bar */}
      <div className="ec-statusbar">
        <div className="ec-statusbar-left">
          <span className="ec-sb-item">
            CIPHER: <span className="val">&nbsp;{cipherLabel}</span>
          </span>
          <span className="ec-sb-item">
            ACTIVE:&nbsp;
            <span className={`val ${currentUser === 'User A' ? 'user-a' : 'user-b'}`}>
              {currentUser}
            </span>
          </span>
          <span className="ec-sb-item">
            MESSAGES: <span className="val">&nbsp;{messages.length}</span>
          </span>
        </div>
        <div className="ec-statusbar-right">CSIT385 · Classical Cipher Lab</div>
      </div>

    </div>
  );
};

export default EncryptionChat;
