"use client";

import { useState, useCallback } from "react";
import styles from "./page.module.css";

const CHARS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  number: "0123456789",
  symbol: "!@#$%^&*()-_=+[]{}|;:,.<>?",
};

type OptionKey = keyof typeof CHARS;

function getStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 20) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(4, Math.ceil((score * 4) / 5));
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}

function generatePassword(length: number, opts: Record<OptionKey, boolean>): string {
  let pool = "";
  const guaranteed: string[] = [];
  for (const [key, enabled] of Object.entries(opts) as [OptionKey, boolean][]) {
    if (enabled) {
      pool += CHARS[key];
      guaranteed.push(CHARS[key][Math.floor(Math.random() * CHARS[key].length)]);
    }
  }
  const arr = [...guaranteed];
  while (arr.length < length) arr.push(pool[Math.floor(Math.random() * pool.length)]);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

export default function Home() {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState<Record<OptionKey, boolean>>({
    upper: true, lower: true, number: true, symbol: true,
  });
  const [password, setPassword] = useState(() => generatePassword(16, { upper: true, lower: true, number: true, symbol: true }));
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);

  const generate = useCallback((len = length, options = opts) => {
    const pw = generatePassword(len, options);
    setPassword(pw);
    setHistory(prev => [pw, ...prev].slice(0, 10));
  }, [length, opts]);

  const toggle = (key: OptionKey) => {
    const active = Object.values(opts).filter(Boolean).length;
    if (opts[key] && active === 1) return;
    const next = { ...opts, [key]: !opts[key] };
    setOpts(next);
    generate(length, next);
  };

  const handleLength = (val: number) => {
    setLength(val);
    generate(val, opts);
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setToast(true);
    setTimeout(() => setToast(false), 1800);
  };

  const copyMain = async () => {
    await copyText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const { score, label } = getStrength(password);
  const strengthClass = ["", "weak", "fair", "good", "strong"][score];

  return (
    <main className={styles.main}>
      <div className={styles.bg} />

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.tag}>// utility tool</div>
          <h1 className={styles.title}>Pass<span>Gen</span></h1>
        </div>

        <div className={styles.card}>
          {/* Output */}
          <div className={styles.outputArea}>
            <div className={styles.passwordDisplay}>{password || "—"}</div>
            <button className={`${styles.copyBtn} ${copied ? styles.copied : ""}`} onClick={copyMain} title="Copy">
              {copied ? "✅" : "📋"}
            </button>
          </div>

          {/* Strength */}
          <div className={styles.strengthRow}>
            <div className={styles.strengthBars}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`${styles.bar} ${i <= score ? styles[strengthClass] : ""}`} />
              ))}
            </div>
            <span className={styles.strengthLabel}>{label || "—"}</span>
          </div>

          {/* Length */}
          <div className={styles.sliderRow}>
            <span className={styles.sliderLabel}>Length</span>
            <span className={styles.sliderValue}>{length}</span>
          </div>
          <input
            type="range"
            min={6}
            max={64}
            value={length}
            onChange={e => handleLength(Number(e.target.value))}
            className={styles.slider}
          />

          {/* Options */}
          <div className={styles.optionsGrid}>
            {(Object.keys(CHARS) as OptionKey[]).map(key => (
              <div
                key={key}
                className={`${styles.toggleItem} ${opts[key] ? styles.active : ""}`}
                onClick={() => toggle(key)}
              >
                <span className={styles.toggleName}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <div className={styles.toggleSwitch} />
              </div>
            ))}
          </div>

          {/* Generate */}
          <button className={styles.genBtn} onClick={() => generate()}>
            Generate Password
          </button>
        </div>

        {/* History */}
        <div className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <span className={styles.historyTitle}>Recent</span>
            <button className={styles.clearBtn} onClick={() => setHistory([])}>Clear</button>
          </div>
          <div className={styles.historyList}>
            {history.length === 0 ? (
              <div className={styles.emptyHistory}>no passwords yet</div>
            ) : (
              history.map((pw, i) => (
                <div key={i} className={styles.historyItem}>
                  <span className={styles.historyPw}>{pw}</span>
                  <button className={styles.historyCopy} onClick={() => copyText(pw)}>📋</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>Copied!</div>
    </main>
  );
}
