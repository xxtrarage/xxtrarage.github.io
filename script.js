const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
},{threshold:.13});

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const bar = document.querySelector('.progress span');
const hero = document.querySelector('.hero-image');

window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = `${max > 0 ? (scrollY/max)*100 : 0}%`;

  if(hero && scrollY < innerHeight * 1.25){
    hero.style.transform = `scale(1.05) translateY(${scrollY * .06}px)`;
  }
},{passive:true});
