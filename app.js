// --- Configure ONCE for your repo ---
const CONFIG = {
  owner: "DVLrepertoire",
  repo:  "songs",
  branch: "main",
  songsPath: "songs",
  // Use API only on the real GitHub Pages domain; locally use songs.json
  useGithubIndex: (location.hostname === "dvlrepertoire.github.io"),
  songsListUrl: "./songs.json"
};

// Platform -> CSS class (for font-specific chord nudges)
(() => {
  const ua = navigator.userAgent || '';
  const cls =
    /Windows/i.test(ua)                ? 'font-win'     :
    /Android/i.test(ua)                ? 'font-android' :
    /iPhone|iPad|iPod/i.test(ua)       ? 'font-ios'     :
    /Macintosh|Mac OS X/i.test(ua)     ? 'font-mac'     :
    /Linux/i.test(ua)                  ? 'font-linux'   :
                                         '';
  if (cls) document.documentElement.classList.add(cls);
})();


// DOM
const app = document.getElementById('app');
const toggle = document.getElementById('instrumentMode');

// --- Instrument mode persistence ---
const MODE_KEY = 'instrumentMode';
const getMode = () => localStorage.getItem(MODE_KEY) === 'on';
const setMode = on => localStorage.setItem(MODE_KEY, on ? 'on' : 'off');

// --- Router wiring ---
window.addEventListener('hashchange', renderRoute);
document.addEventListener('DOMContentLoaded', () => {
  const on = getMode();
  if (toggle) toggle.checked = on;
  document.body.classList.toggle('hide-chords', !on);

  if (toggle) {
    toggle.addEventListener('change', () => {
      const newOn = toggle.checked;
      setMode(newOn);
      document.body.classList.toggle('hide-chords', !newOn);
    });
  }

  renderRoute();
});

function renderRoute() {
  // keep UI in sync with stored mode on every navigation
  const on = getMode();
  if (toggle) toggle.checked = on;
  document.body.classList.toggle('hide-chords', !on);

  const [, route, file] = location.hash.split('/');
  if (route === 'song' && file) {
    renderSong(decodeURIComponent(file));
  } else {
    renderIndex();
  }
}

// ---------- Index: GitHub API (online) → fallback to songs.json ----------
async function getSongList() {
  if (CONFIG.useGithubIndex) {
    try {
      const api = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.songsPath}?ref=${CONFIG.branch}`;
      const res = await fetch(api, { headers: { 'Accept': 'application/vnd.github+json' } });
      if (res.ok) {
        const data = await res.json();
        return data
          .filter(x => x.type === 'file' && x.name.toLowerCase().endsWith('.md'))
          .map(x => ({ file: x.name, title: titleFromName(x.name) }));
      } else {
        console.warn('GitHub API not ok:', res.status, await res.text());
      }
    } catch (e) {
      console.warn('GitHub API fetch failed, falling back to songs.json', e);
    }
  }

  // Fallback: songs.json (works locally and offline)
  try {
    const res = await fetch(CONFIG.songsListUrl, { cache: 'no-cache' });
    if (res.ok) return await res.json();
    console.warn('songs.json not ok:', res.status, await res.text());
  } catch (e) {
    console.warn('Failed to load songs.json', e);
  }
  return [];
}

function titleFromName(name) {
  return name.replace(/\.md$/i,'').replace(/[-_]/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
}

async function renderIndex() {
  const songs = await getSongList();
  songs.sort((a,b) => (a.title || a.file).localeCompare(b.title || b.file));

  app.innerHTML = `
    <h2>Index</h2>
    ${songs.length ? `
      <ol>${songs.map(s => `
        <li><a href="#/song/${encodeURIComponent(s.file)}">
          ${s.title || titleFromName(s.file)}
        </a></li>`).join('')}
      </ol>
    ` : `<p class="empty">No songs found.</p>`}
  `;
}

// ---------- SONG VIEW ----------
async function renderSong(file) {
  const url = `./${CONFIG.songsPath}/${file}`;
  let raw = '';
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    raw = await res.text();
  } catch (e) {
    app.innerHTML = `
      <h2>Not found</h2>
      <p class="empty">Couldn’t load <code>${file}</code>.</p>
    `;
    console.error('Failed to load song:', file, e);
    return;
  }

  const { body, fm } = extractFrontMatter(raw);
  const parser = new ChordSheetJS.ChordProParser();
  const song = parser.parse(body);
  const formatter = new ChordSheetJS.HtmlDivFormatter();
  const htmlContent = formatter.format(song);

  // Post-process HTML to render markdown in lyrics
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.querySelectorAll('.lyrics').forEach(lyricsEl => {
    lyricsEl.innerHTML = mdInline(lyricsEl.textContent);
  });
  const processedHtmlContent = tempDiv.innerHTML;

  // Set chord visibility from the global Instrument mode
  document.body.classList.toggle('hide-chords', !getMode());
  if (toggle) toggle.checked = getMode(); // keep the header checkbox in sync

  app.innerHTML = `
    ${fm.title || song.title ? `<h1>${fm.title || song.title}</h1>` : ''}
    ${fm.key ? `<div class="meta">Key: ${fm.key}</div>` : ''}
    <div class="song chorded" id="songContainer">${processedHtmlContent}</div>
  `;
}

// ---------- Helpers ----------

// Strip simple YAML front-matter (--- ... ---) and parse "key: value" lines
function extractFrontMatter(src) {
  const s = src.replace(/\r\n?/g, '\n');
  const m = s.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { body: s, fm: {} };

  const fmBlock = m[1];
  const rest = s.slice(m[0].length);
  const fm = {};
  for (const line of fmBlock.split('\n')) {
    const kv = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)\s*$/);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    let val = kv[2].trim();
    val = val.replace(/^['"]|['"]$/g, ''); // strip surrounding quotes
    fm[key] = val;
  }
  return { body: rest, fm };
}

// Very small markdown inline renderer for non-chord lines
function mdInline(s) {
  let t = escapeHtml(s);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/__(.+?)__/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  t = t.replace(/_(.+?)_/g, '<em>$1</em>');
  return t;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
