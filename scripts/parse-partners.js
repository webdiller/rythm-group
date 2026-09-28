(function() {
  // Парсер секции #about — "Кто мы" / "About us"
  // Собирает заголовок, подзаголовок и карточки (иконка, заголовок, описание).

  const section = document.querySelector('#about');
  if (!section) {
    console.warn('Секция #about не найдена');
    window.aboutData = null;
    return;
  }

  // Заголовок и подзаголовок
  const title = section.querySelector('h2')?.textContent.trim() || '';
  const subtitle = section.querySelector('p')?.textContent.trim() || '';

  const cards = [];

  // Находим все карточки: они внутри .grid, каждая карточка — это div с классом group
  const grid = section.querySelector('.grid');
  if (grid) {
    // Карточки могут быть обёрнуты в дополнительные div (для анимации)
    // Проходим по всем потомкам .group, которые находятся внутри grid
    const cardElements = grid.querySelectorAll('.group');
    cardElements.forEach((card) => {
      // Иконка: извлекаем имя из класса SVG (lucide-xxx)
      const svg = card.querySelector('svg');
      let icon = '';
      if (svg) {
        const lucideClass = Array.from(svg.classList).find(cls => cls.startsWith('lucide-'));
        if (lucideClass) {
          icon = lucideClass.replace('lucide-', '');
        }
      }

      const cardTitle = card.querySelector('h3')?.textContent.trim() || '';
      const cardDesc = card.querySelector('p')?.textContent.trim() || '';

      cards.push({
        icon,
        title: cardTitle,
        description: cardDesc
      });
    });
  }

  const result = {
    title,
    subtitle,
    cards
  };

  console.log('Собранные данные #about:', result);
  console.table(result.cards);
  window.aboutData = result;
})();