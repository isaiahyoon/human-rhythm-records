import './styles.css';

const viewButtons = document.querySelectorAll('[data-view]');
const deckParts = document.querySelectorAll('[data-deck-part]');

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const view = button.dataset.view;
    viewButtons.forEach((control) => {
      const active = control === button;
      control.classList.toggle('active', active);
      control.setAttribute('aria-pressed', String(active));
    });
    deckParts.forEach((part) => {
      part.toggleAttribute('hidden', part.dataset.deckPart !== view);
    });
  });
});
