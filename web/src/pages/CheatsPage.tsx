import { useMemo, useState } from 'react';
import type { Category } from '../api/types';
import { useToast } from '../components/Toast';
import { EmptyState } from '../components/ui';
import { CHEATSHEET } from '../data/cheatsheet';
import { CATEGORIES, categoryMeta } from '../data/meta';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback for non-secure contexts (plain http on a LAN address)
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

export default function CheatsPage() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<Category | ''>('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHEATSHEET.filter(
      (c) =>
        (!topic || c.topic === topic) &&
        (!q || c.title.toLowerCase().includes(q) || c.command.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
    );
  }, [query, topic]);

  async function copy(command: string) {
    const ok = await copyText(command);
    toast(ok ? `Copied: ${command}` : 'Could not copy', ok ? 'success' : 'error');
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1>Command cheatsheet</h1>
      </div>
      <div className="filters">
        <input className="input" placeholder="Search commands…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search commands" />
        <div className="chips">
          <button className={`chip${topic === '' ? ' active' : ''}`} onClick={() => setTopic('')}>
            All
          </button>
          {CATEGORIES.filter((c) => CHEATSHEET.some((i) => i.topic === c.value)).map((c) => (
            <button key={c.value} className={`chip${topic === c.value ? ' active' : ''}`} onClick={() => setTopic(c.value)} style={{ ['--c' as string]: c.color }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState title="No commands found" hint="Try another search term or topic." />
      ) : (
        <div className="cheat-grid">
          {shown.map((c) => {
            const cat = categoryMeta(c.topic);
            return (
              <article key={c.command} className="cheat-card" style={{ ['--c' as string]: cat.color }}>
                <header>
                  <h3>{c.title}</h3>
                  <span style={{ color: cat.color }}>{cat.label}</span>
                </header>
                <pre className="code">{c.command}</pre>
                <footer>
                  <span className="muted">{c.description}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => copy(c.command)}>
                    Copy
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
