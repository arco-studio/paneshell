(() => {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // スクロールで要素を表示（同じ親の中では少しずつ遅らせる）
  const items = document.querySelectorAll('.reveal');
  const groups = new Map();
  items.forEach(el => {
    const list = groups.get(el.parentElement) || [];
    el.style.setProperty('--d', `${Math.min(list.length, 4) * 0.08}s`);
    list.push(el);
    groups.set(el.parentElement, list);
  });
  if ('IntersectionObserver' in window && !reduce) {
    let fired = false;
    // 監視が働かない環境でも中身が消えたままにならないようにする
    setTimeout(() => { if (!fired) items.forEach(el => el.classList.add('in')); }, 1500);
    const io = new IntersectionObserver(entries => {
      fired = true;
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  } else {
    items.forEach(el => el.classList.add('in'));
  }

  // カードの光をマウスに追従
  document.querySelectorAll('.card, .plan, .setup li').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // 見出し上のタイピング
  const typed = document.getElementById('typed');
  const box = document.querySelector('.typing');
  const lines = ((box && box.dataset.lines) || 'tmux attach -t demo').split('|');
  if (typed) {
    if (reduce) { typed.textContent = lines[0]; }
    else {
      let li = 0, ci = 0, del = false;
      const tick = () => {
        const line = lines[li];
        if (!del) {
          typed.textContent = line.slice(0, ++ci);
          if (ci === line.length) { del = true; return setTimeout(tick, 1800); }
          return setTimeout(tick, 55 + Math.random() * 60);
        }
        typed.textContent = line.slice(0, --ci);
        if (ci === 0) { del = false; li = (li + 1) % lines.length; return setTimeout(tick, 350); }
        setTimeout(tick, 22);
      };
      setTimeout(tick, 600);
    }
  }

  if (reduce) return;

  // 端末画像をマウスに合わせて傾ける
  const tilt = document.getElementById('tilt');
  const phone = tilt && tilt.querySelector('.phone');
  if (tilt && phone && matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', e => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      phone.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 12}deg)`;
    });
  }

  // 背景をゆっくり昇っていくコマンド文字
  const cv = document.getElementById('glyphs');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const words = ['ssh', 'tmux', '❯', 'claude', 'codex', 'git push', 'ls -la', 'C-b %', 'C-b "', 'npm test', 'vnc', '⌃C', 'esc', 'tab', 'cd ~/dev', '$', '~', '█'];
  let W, H, dpr, parts = [];
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr;
    H = cv.height = innerHeight * dpr;
    const n = Math.round(Math.min(46, innerWidth / 28));
    parts = Array.from({ length: n }, () => spawn(true));
  };
  const spawn = (anywhere) => ({
    x: Math.random() * W,
    y: anywhere ? Math.random() * H : H + 20 * dpr,
    v: (0.15 + Math.random() * 0.35) * dpr,
    s: (10 + Math.random() * 6) * dpr,
    a: 0.05 + Math.random() * 0.12,
    t: words[(Math.random() * words.length) | 0],
  });
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(draw);
  });
  const draw = () => {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.y -= p.v;
      if (p.y < -20 * dpr) Object.assign(p, spawn(false));
      const fade = Math.min(1, p.y / (H * 0.25), (H - p.y) / (H * 0.15));
      ctx.globalAlpha = Math.max(0, p.a * fade);
      ctx.fillStyle = '#5ecba7';
      ctx.font = `${p.s}px ui-monospace, Menlo, monospace`;
      ctx.fillText(p.t, p.x, p.y);
    }
    requestAnimationFrame(draw);
  };
  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();
