// Single configuration surface for business figures; replace these values with CMS/API data when connected.
const siteConfig = { counters: { onShift: 47, filled: 94 } };

document.querySelectorAll('[data-count]').forEach((el) => {
  const finalValue = el.dataset.count === '47' ? siteConfig.counters.onShift : siteConfig.counters.filled;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { el.textContent = finalValue; return; }
  const start = performance.now(), duration = 900;
  const animate = (now) => { const p = Math.min((now - start) / duration, 1); el.textContent = Math.round(finalValue * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(animate); };
  requestAnimationFrame(animate);
});

const header = document.querySelector('.header');
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 8), { passive: true });

const menu = document.querySelector('.mobile-menu'), menuButton = document.querySelector('.menu-button');
function setMenu(open) { menu.classList.toggle('open', open); menu.setAttribute('aria-hidden', String(!open)); menuButton.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; }
menuButton.addEventListener('click', () => setMenu(true));
document.querySelector('.close-menu').addEventListener('click', () => setMenu(false));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

const revealObserver = new IntersectionObserver((entries) => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const form = document.querySelector('#request-form');
const status = form.querySelector('.form-status');
form.phone.addEventListener('input', (e) => {
  let digits = e.target.value.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11); if (digits && digits[0] !== '7') digits = '7' + digits;
  const p = digits.slice(1); e.target.value = !digits ? '' : '+7' + (p ? ' (' + p.slice(0, 3) : '') + (p.length > 3 ? ') ' + p.slice(3, 6) : '') + (p.length > 6 ? '-' + p.slice(6, 8) : '') + (p.length > 8 ? '-' + p.slice(8, 10) : '');
});
form.addEventListener('submit', async (event) => {
  event.preventDefault(); status.textContent = '';
  if (!form.checkValidity() || form.phone.value.replace(/\D/g, '').length < 11) { status.textContent = 'Пожалуйста, заполните обязательные поля и укажите корректный телефон.'; status.style.color = '#ffe0d4'; form.reportValidity(); return; }
  const submit = form.querySelector('[type=submit]'); submit.disabled = true; submit.textContent = 'Отправляем…';
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Не удалось отправить заявку.');

    status.textContent = 'Спасибо! Заявка отправлена. Менеджер свяжется с вами.';
    status.style.color = '#fff';
    form.reset();
  } catch (error) {
    status.textContent = error.message || 'Не удалось отправить заявку. Попробуйте ещё раз.';
    status.style.color = '#ffe0d4';
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Получить расчёт <b>→</b>';
  }
});
