(function() {
    // Сбор информации о каналах из секции #channels
    function collectChannels() {
      const root = document.querySelector('#channels');
      if (!root) return [];
  
      const items = root.querySelectorAll('.grid a[href]');
      const channels = [];
  
      items.forEach((a, index) => {
        const img = a.querySelector('img');
        const name = a.querySelector('h3')?.textContent.trim() || '';
        const url = a.getAttribute('href') || '';
  
        // Все span с текстом статистики
        const spans = Array.from(a.querySelectorAll('div.text-muted-foreground span'))
          .map(s => s.textContent.trim());
  
        const subscribersText = spans.find(t => /подписчик/i.test(t)) || '0';
        const reachText = spans.find(t => /охват/i.test(t)) || '0';
  
        const subscribers = Number(subscribersText.replace(/\D/g, '')) || 0;
        const reach = Number(reachText.replace(/\D/g, '')) || 0;
  
        const avatarPath = img?.getAttribute('src') || '';
        const avatar = avatarPath ? new URL(avatarPath, window.location.origin).href : '';
  
        // ID канала из пути аватара, например /channels/19/avatar -> 19
        const idMatch = avatarPath.match(/channels\/(\d+)\/avatar/);
        const id = idMatch ? Number(idMatch[1]) : index + 1;
  
        channels.push({
          id,
          name,
          url,
          avatar,               // абсолютная ссылка на изображение
          avatarPath,           // относительный путь (если нужен)
          subscribers,
          reach,
          engagementRate: subscribers ? +(reach / subscribers * 100).toFixed(2) : 0
        });
      });
  
      return channels;
    }
  
    // Запуск и вывод результата
    const channelsData = collectChannels();
    console.log('Собранные каналы:', channelsData);
  
    // Делаем массив доступным глобально (например, window.channelsData)
    window.channelsData = channelsData;
  })();