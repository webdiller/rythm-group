(function() {
  // Поиск секции со статистикой: grid с 4 элементами, в каждом по 2 span
  function findStatsSection() {
    const sections = document.querySelectorAll('section');
    for (const section of sections) {
      const grids = section.querySelectorAll('.grid');
      for (const grid of grids) {
        const children = Array.from(grid.children);
        if (children.length !== 4) continue;
        const allHaveTwoSpans = children.every(child => {
          const spans = child.querySelectorAll('span');
          return spans.length >= 2;
        });
        if (allHaveTwoSpans) return section;
      }
    }
    return null;
  }

  const section = findStatsSection();
  if (!section) {
    console.warn('Секция со статистикой не найдена');
    window.statsData = null;
    return;
  }

  // Заголовок и подзаголовок
  const titleEl = section.querySelector('h2');
  const title = titleEl ? titleEl.textContent.trim() : '';

  const subtitleEl = section.querySelector('p');
  const subtitle = subtitleEl ? subtitleEl.textContent.trim() : '';

  // Сбор статистики
  const grid = section.querySelector('.grid');
  const stats = [];
  if (grid) {
    for (const item of grid.children) {
      const spans = item.querySelectorAll('span');
      if (spans.length >= 2) {
        stats.push({
          value: spans[0].textContent.trim(),
          label: spans[1].textContent.trim()
        });
      }
    }
  }

  const result = { title, subtitle, stats };

  console.log('Собранные данные статистики:', result);
  console.table(result.stats);
  window.statsData = result;
})();