(function() {
  // Парсер секции #cases — "С кем работаем" / "Our partners"
  // Собирает заголовок, подзаголовок и список партнёров с категориями.

  const section = document.querySelector('#cases');
  if (!section) {
    console.warn('Секция #cases не найдена');
    window.casesData = null;
    return;
  }

  // Заголовок и подзаголовок
  const title = section.querySelector('h2')?.textContent.trim() || '';
  const subtitle = section.querySelector('p')?.textContent.trim() || '';

  const partners = [];

  // Каждая категория — это блок с h3 и следующим за ним .grid
  // Ищем все h3 внутри секции (кроме заголовка h2)
  const categoryHeaders = section.querySelectorAll('h3');

  categoryHeaders.forEach((h3) => {
    const categoryName = h3.textContent.trim();

    // Следующий .grid после h3 — это список партнёров в категории
    // Ищем ближайший .grid среди следующих соседей
    let grid = null;
    let next = h3.nextElementSibling;
    while (next) {
      if (next.classList.contains('grid')) {
        grid = next;
        break;
      }
      // Иногда grid может быть обёрнут в div
      const innerGrid = next.querySelector?.('.grid');
      if (innerGrid) {
        grid = innerGrid;
        break;
      }
      next = next.nextElementSibling;
    }

    if (!grid) return;

    // Внутри grid — карточки партнёров
    Array.from(grid.children).forEach((card) => {
      const img = card.querySelector('img');
      const nameEl = card.querySelector('span'); // имя партнёра в span

      if (!img || !nameEl) return;

      const name = nameEl.textContent.trim();
      const logoSrc = img.getAttribute('src') || '';
      const logoAlt = img.getAttribute('alt') || '';
      const logoTitle = img.getAttribute('title') || '';

      // Абсолютная ссылка на логотип
      let logoUrl = logoSrc;
      try {
        logoUrl = new URL(logoSrc, window.location.origin).href;
      } catch (e) {
        // оставляем как есть
      }

      partners.push({
        category: categoryName,
        name,
        logo: logoUrl,
        logoPath: logoSrc,
        logoAlt,
        logoTitle
      });
    });
  });

  const result = {
    title,
    subtitle,
    partners
  };

  console.log('Собранные данные #cases:', result);
  console.table(result.partners);
  window.casesData = result;
})();