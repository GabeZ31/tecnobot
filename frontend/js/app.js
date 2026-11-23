document.addEventListener('DOMContentLoaded', () => {
  const introCover = document.getElementById('intro-cover');
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main');

  const startApp = () => {
    introCover.classList.add('hide');
    sidebar.classList.add('animate-in');
    main.classList.add('animate-in');
    introCover.removeEventListener('click', startApp);
    setTimeout(() => introCover.remove(), 500);
  };

  introCover.addEventListener('click', startApp);
});
