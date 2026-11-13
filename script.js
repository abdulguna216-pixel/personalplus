const header = document.querySelector('.header');
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 8), { passive: true });

const menu = document.querySelector('.mobile-menu'), menuButton = document.querySelector('.menu-button');
function setMenu(open) { menu.classList.toggle('open', open); menu.setAttribute('aria-hidden', String(!open)); menuButton.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; }
menuButton.addEventListener('click', () => setMenu(true));
document.querySelector('.close-menu').addEventListener('click', () => setMenu(false));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

const revealObserver = new IntersectionObserver((entries) => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

document.querySelectorAll('button[aria-haspopup="dialog"][aria-controls]').forEach((button) => {
  const dialog = document.getElementById(button.getAttribute('aria-controls'));
  button.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('close', () => button.focus({ preventScroll: true }));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});
