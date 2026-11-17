/**
 * DearMy Bakeshop interactions.
 *
 * 1. The blank: cycles sample words, lets the visitor write their own, and
 *    carries that word through the rest of the page.
 * 2. Bakes: filter by type, and pop bakes into the order note.
 * 3. Order note: builds a message the visitor can copy and send.
 * 4. Small extras: header border once scrolled, scroll reveals.
 *
 * The page is fully readable without this script; it only adds behaviour.
 */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const STORAGE_KEY = 'dearmy:for';

const store = {
  get() {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  },
  set(value) {
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Private mode or blocked storage: the word just won't be remembered. */
    }
  },
};

/* ---------------------------------------------------------------- */
/* 1. The blank                                                      */
/* ---------------------------------------------------------------- */

const main = document.querySelector('main');
const fallbackWord = main?.dataset.fallback || 'favourite person';
const blank = document.querySelector('[data-blank]');
const input = blank?.querySelector('.blank__input');
const ghost = blank?.querySelector('.blank__ghost');
const dearSpans = document.querySelectorAll('[data-dear]');

const cleanWord = (value) => value.replace(/\s+/g, ' ').trim();

function applyWord(raw) {
  const word = cleanWord(raw);
  blank?.classList.toggle('is-filled', word.length > 0);
  dearSpans.forEach((el) => {
    el.textContent = word || fallbackWord;
  });
}

if (blank && input && ghost) {
  const words = JSON.parse(blank.dataset.words || '[]');
  let index = 0;
  let timer = null;

  const showNext = () => {
    index = (index + 1) % words.length;
    ghost.textContent = words[index];
    ghost.classList.remove('is-swapping');
    void ghost.offsetWidth; // restart the animation
    ghost.classList.add('is-swapping');
  };

  const shouldCycle = () =>
    words.length > 1 &&
    !reduceMotion.matches &&
    !document.hidden &&
    document.activeElement !== input &&
    input.value === '';

  const syncCycle = () => {
    clearInterval(timer);
    timer = shouldCycle() ? setInterval(showNext, 2200) : null;
  };

  const saved = store.get();
  if (saved) input.value = saved;
  applyWord(input.value);

  input.addEventListener('input', () => {
    applyWord(input.value);
    store.set(cleanWord(input.value));
    renderNote();
  });
  input.addEventListener('focus', syncCycle);
  input.addEventListener('blur', syncCycle);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') input.blur();
  });
  document.addEventListener('visibilitychange', syncCycle);
  reduceMotion.addEventListener('change', syncCycle);
  syncCycle();
}

/* ---------------------------------------------------------------- */
/* 2. Bakes: filter and pick                                         */
/* ---------------------------------------------------------------- */

const chips = document.querySelectorAll('[data-filter]');
const bakeItems = document.querySelectorAll('.bake');

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const filter = chip.dataset.filter;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    bakeItems.forEach((item) => {
      // The "ask us" tile has no category and always stays visible.
      item.hidden = filter !== 'all' && 'category' in item.dataset && item.dataset.category !== filter;
      if (!item.hidden) item.classList.add('is-in');
    });
  });
});

/** Picked bakes, in the order they were picked: id -> name. */
const picks = new Map();
const pickButtons = document.querySelectorAll('[data-pick]');

function setPicked(id, name, picked) {
  if (picked) picks.set(id, name);
  else picks.delete(id);
  pickButtons.forEach((btn) => {
    if (btn.dataset.pick === id) btn.setAttribute('aria-pressed', String(picked));
  });
  renderNote(picked ? id : null);
}

pickButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const picked = btn.getAttribute('aria-pressed') !== 'true';
    setPicked(btn.dataset.pick, btn.dataset.name, picked);
    btn.classList.remove('is-popped');
    void btn.offsetWidth;
    btn.classList.add('is-popped');
  });
});

/* ---------------------------------------------------------------- */
/* 3. Order note                                                     */
/* ---------------------------------------------------------------- */

const picksList = document.getElementById('order-picks');
const picksLabel = document.getElementById('picks-label');
const emptyNote = document.getElementById('order-empty');
const chip = document.getElementById('letter-chip');
const chipCount = document.getElementById('letter-chip-count');
const copyButton = document.getElementById('copy-note');
const copyStatus = document.getElementById('copy-status');

function renderNote(newId = null) {
  if (!picksList) return;
  picksList.replaceChildren();

  picks.forEach((name, id) => {
    const li = document.createElement('li');
    if (id === newId) li.className = 'is-new';

    const label = document.createElement('span');
    label.textContent = name;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'note__remove';
    remove.setAttribute('aria-label', `Take ${name} out of your letter`);
    remove.textContent = '✕';
    remove.addEventListener('click', () => {
      setPicked(id, name, false);
      copyButton?.focus();
    });

    li.append(label, remove);
    picksList.append(li);
  });

  const hasPicks = picks.size > 0;
  if (picksLabel) picksLabel.hidden = !hasPicks;
  if (emptyNote) emptyNote.hidden = hasPicks;
  if (chip && chipCount) {
    chipCount.textContent = String(picks.size);
    chip.hidden = !hasPicks;
  }
  if (copyStatus) copyStatus.textContent = '';
}

function noteText() {
  const word = cleanWord(input?.value || '') || fallbackWord;
  const opening = `Hi DearMy! I'd love to order something for dear my ${word}.`;
  if (picks.size === 0) return `${opening} What's good this week?`;
  return `${opening} I've got my eye on: ${[...picks.values()].join(', ')}.`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and insecure contexts: fall back to a temporary textarea.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'absolute';
    area.style.left = '-9999px';
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

copyButton?.addEventListener('click', async () => {
  const ok = await copyText(noteText());
  if (!copyStatus) return;
  copyStatus.textContent = ok
    ? `${copyButton.dataset.done}. Paste it into a message, or read it out when you call.`
    : 'Copying didn’t work in this browser. Select the note above and copy it by hand.';
});

// Hide the floating chip while the order section is on screen: it would only point at itself.
const orderSection = document.getElementById('order');
if (orderSection && chip && 'IntersectionObserver' in window) {
  new IntersectionObserver(
    ([entry]) => {
      chip.style.visibility = entry.isIntersecting ? 'hidden' : '';
    },
    { rootMargin: '0px 0px -20% 0px' }
  ).observe(orderSection);
}

renderNote();

/* ---------------------------------------------------------------- */
/* 4. Header border and scroll reveals                               */
/* ---------------------------------------------------------------- */

const header = document.querySelector('.site-header');
if (header) {
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

const revealEls = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-in'));
}
