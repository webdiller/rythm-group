(async function () {
    // ============================================================
    //  Blog Export Script (для Rythm Group админки)
    //  Запускать на странице /blog (RU или EN версия).
    //  Собирает категории + посты (полные body_html) и скачивает JSON.
    // ============================================================
  
    const CONFIG = {
      fetchFullPosts: true,   // переходить на каждую страницу поста
      concurrency: 3,         // параллельных запросов
      delayMs: 250,           // пауза между запросами
      includeCategoryPages: true, // обходить /blog/{slug} для полноты
    };
  
    // ---------- helpers ----------
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  
    const absUrl = (u) => {
      if (!u) return null;
      try { return new URL(u, location.origin).href; } catch { return u; }
    };
  
    const locale = (() => {
      const l = (document.documentElement.lang || '').toLowerCase();
      return l.startsWith('en') ? 'en' : 'ru';
    })();
  
    const toUnix = (iso) => {
      if (!iso) return null;
      const t = new Date(iso).getTime();
      return Number.isFinite(t) ? Math.floor(t / 1000) : null;
    };
  
    async function fetchDoc(url) {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
      const html = await res.text();
      return new DOMParser().parseFromString(html, 'text/html');
    }
  
    function absolutizeBody(html) {
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      tpl.content.querySelectorAll('img[src]').forEach((el) =>
        el.setAttribute('src', absUrl(el.getAttribute('src')))
      );
      tpl.content.querySelectorAll('a[href]').forEach((el) =>
        el.setAttribute('href', absUrl(el.getAttribute('href')))
      );
      return tpl.innerHTML.trim();
    }
  
    function slugFromPath(pathname) {
      const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean);
      return { categorySlug: parts[1] || null, slug: parts[2] || null };
    }
  
    // ---------- list page parsing ----------
    function findCategoryNav(doc) {
      const navs = doc.querySelectorAll('nav');
      for (const nav of navs) {
        const links = [...nav.querySelectorAll('a[href]')].filter((a) => {
          const h = a.getAttribute('href') || '';
          return /^\/blog(\/[^/]+)?\/?$/.test(h);
        });
        if (links.length >= 2) return nav;
      }
      return null;
    }
  
    function parseCategories(doc) {
      const nav = findCategoryNav(doc);
      if (!nav) return [];
      const cats = [];
      let idx = 0;
      for (const a of nav.querySelectorAll('a[href]')) {
        const href = a.getAttribute('href') || '';
        // только /blog/{slug}, без "Все" (/blog)
        const m = href.match(/^\/blog\/([^/]+)\/?$/);
        if (!m) continue;
        const slug = m[1];
        const name = a.textContent.trim();
        cats.push({
          slug,
          name_ru: locale === 'ru' ? name : '',
          name_en: locale === 'en' ? name : '',
          order_index: idx++,
          deleted_at: null,
          created_at: null,
        });
      }
      return cats;
    }
  
    function parseStubs(doc) {
      const items = [...doc.querySelectorAll('ul.grid > li')];
      const stubs = [];
      for (const li of items) {
        const link = li.querySelector('a[href*="/blog/"]');
        if (!link) continue;
        const href = link.getAttribute('href');
        const { categorySlug, slug } = slugFromPath(href);
        if (!categorySlug || !slug) continue;
  
        const title = li.querySelector('h2 a')?.textContent.trim() || '';
        const excerpt = li.querySelector('[data-slot="card-content"] p')?.textContent.trim() || '';
        const cover = li.querySelector('img')?.getAttribute('src') || null;
        const timeEl = li.querySelector('time');
        const publishedISO = timeEl?.getAttribute('datetime') || null;
  
        stubs.push({
          url: href,
          categorySlug,
          slug,
          title,
          excerpt,
          cover,
          publishedAt: toUnix(publishedISO),
        });
      }
      return stubs;
    }
  
    // ---------- post page parsing ----------
    function parsePostPage(doc, url) {
      const { categorySlug: urlCat, slug } = slugFromPath(new URL(url, location.origin).pathname);
  
      // breadcrumb: /blog/{category}
      let catSlug = urlCat;
      for (const a of doc.querySelectorAll('nav[aria-label="breadcrumb"] a[href]')) {
        const h = a.getAttribute('href') || '';
        if (/^\/blog\/[^/]+\/?$/.test(h)) {
          catSlug = h.replace(/^\/blog\//, '').replace(/\/$/, '');
          break;
        }
      }
  
      const header = doc.querySelector('article > header');
      const catName = header?.querySelector('p.text-primary')?.textContent.trim() || '';
      const title = header?.querySelector('h1')?.textContent.trim() || '';
      const publishedISO = header?.querySelector('time')?.getAttribute('datetime') || null;
  
      const cover = doc.querySelector('article figure img')?.getAttribute('src') || null;
      const bodyEl = doc.querySelector('.blog-article-body');
      const bodyHtml = bodyEl ? absolutizeBody(bodyEl.innerHTML) : '';
  
      const publishedAt = toUnix(publishedISO);
  
      return {
        category_slug: catSlug,
        slug,
        title_ru: locale === 'ru' ? title : '',
        title_en: locale === 'en' ? title : '',
        excerpt_ru: '',
        excerpt_en: '',
        body_html_ru: locale === 'ru' ? bodyHtml : '',
        body_html_en: locale === 'en' ? bodyHtml : '',
        cover_image_url: cover ? absUrl(cover) : null,
        status: 'published',
        published_at: publishedAt,
        deleted_at: null,
        created_at: null,
        updated_at: null,
        // не в БД, вспомогательное:
        _category_name: catName,
      };
    }
  
    // ---------- concurrency runner ----------
    async function runPool(items, worker, concurrency, delayMs) {
      const out = new Array(items.length);
      let i = 0;
      async function loop() {
        while (i < items.length) {
          const idx = i++;
          try {
            out[idx] = await worker(items[idx], idx);
          } catch (e) {
            console.error(`[${idx}] ${items[idx]} —`, e);
            out[idx] = { _error: String(e), url: items[idx] };
          }
          if (delayMs) await sleep(delayMs);
        }
      }
      await Promise.all(Array.from({ length: concurrency }, loop));
      return out;
    }
  
    // ---------- main ----------
    const isPostPage = !!document.querySelector('.blog-article-body');
    const output = {
      locale,
      exported_at: new Date().toISOString(),
      source_url: location.href,
      blog_categories: [],
      blog_posts: [],
    };
  
    if (isPostPage) {
      // ---- single post mode ----
      const post = parsePostPage(document, location.href);
      delete post._category_name;
      output.blog_posts.push(post);
      console.log('✅ Собран одиночный пост:', post);
    } else {
      // ---- list mode ----
      const listUrls = new Set(['/blog']);
      const catsFromCurrent = parseCategories(document);
      for (const c of catsFromCurrent) listUrls.add(`/blog/${c.slug}`);
  
      // собираем категории + stubs со всех листингов
      const allStubsByUrl = new Map();
      let categories = catsFromCurrent;
  
      for (const listUrl of listUrls) {
        try {
          const doc =
            listUrl === location.pathname || listUrl === '/blog' && location.pathname === '/blog'
              ? document
              : await fetchDoc(listUrl);
  
          if (listUrl === '/blog') {
            const c = parseCategories(doc);
            if (c.length) categories = c;
          }
          for (const s of parseStubs(doc)) {
            if (!allStubsByUrl.has(s.url)) allStubsByUrl.set(s.url, s);
          }
        } catch (e) {
          console.warn(`Не удалось загрузить список ${listUrl}:`, e);
        }
        if (CONFIG.delayMs) await sleep(CONFIG.delayMs);
      }
  
      output.blog_categories = categories;
      const stubs = [...allStubsByUrl.values()];
      console.log(`Найдено: ${categories.length} категорий, ${stubs.length} постов`);
  
      // ---- fetch each post page ----
      if (CONFIG.fetchFullPosts && stubs.length) {
        const stubBySlug = new Map(stubs.map((s) => [s.slug, s]));
        const posts = await runPool(
          stubs.map((s) => s.url),
          async (u) => {
            const doc = await fetchDoc(u);
            return parsePostPage(doc, u);
          },
          CONFIG.concurrency,
          CONFIG.delayMs
        );
  
        output.blog_posts = posts
          .filter((p) => p && !p._error)
          .map((p) => {
            const stub = stubBySlug.get(p.slug);
            if (stub) {
              if (locale === 'ru') p.excerpt_ru = stub.excerpt;
              else p.excerpt_en = stub.excerpt;
              if (!p.cover_image_url && stub.cover)
                p.cover_image_url = absUrl(stub.cover);
            }
            delete p._category_name;
            return p;
          });
      } else {
        // без fetch — только стабы
        output.blog_posts = stubs.map((s) => ({
          category_slug: s.categorySlug,
          slug: s.slug,
          title_ru: locale === 'ru' ? s.title : '',
          title_en: locale === 'en' ? s.title : '',
          excerpt_ru: locale === 'ru' ? s.excerpt : '',
          excerpt_en: locale === 'en' ? s.excerpt : '',
          body_html_ru: '',
          body_html_en: '',
          cover_image_url: s.cover ? absUrl(s.cover) : null,
          status: 'published',
          published_at: s.publishedAt,
          deleted_at: null,
          created_at: null,
          updated_at: null,
        }));
      }
    }
  
    // ---------- output ----------
    console.log('=== RESULT ===');
    console.log(output);
    console.table(output.blog_categories);
    console.table(
      output.blog_posts.map((p) => ({
        slug: p.slug,
        category_slug: p.category_slug,
        title: p.title_ru || p.title_en,
        published_at: p.published_at,
        body_len: (p.body_html_ru || p.body_html_en || '').length,
      }))
    );
  
    // ---------- download ----------
    const filename = `blog-export-${locale}-${Date.now()}.json`;
    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  
    window.__blogExport = output;
    console.log(
      `✅ Экспортировано ${output.blog_posts.length} постов и ${output.blog_categories.length} категорий → ${filename}`
    );
  })();