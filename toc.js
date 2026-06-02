async function loadTOC() {
  const response = await fetch('manifest.json');
  const manifest = await response.json();
  const tocContainer = document.getElementById('toc');

  manifest.categories.forEach(category => {
    // Category header
    const catHeader = document.createElement('div');
    catHeader.className = 'toc-category';
    catHeader.textContent = category.name;
    tocContainer.appendChild(catHeader);

    // Top-level articles
    if (category.articles && category.articles.length > 0) {
      category.articles.forEach(article => {
        const link = document.createElement('a');
        link.className = 'toc-article';
        link.textContent = article.title;
        link.href = '#';
        link.onclick = (e) => {
          e.preventDefault();
          loadArticle(article.file);
        };
        tocContainer.appendChild(link);
      });
    }

    // Subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(sub => {
        const subHeader = document.createElement('div');
        subHeader.className = 'toc-subcategory';
        subHeader.textContent = sub.name;
        tocContainer.appendChild(subHeader);

        sub.articles.forEach(article => {
          const link = document.createElement('a');
          link.className = 'toc-article toc-article-sub';
          link.textContent = article.title;
          link.href = '#';
          link.onclick = (e) => {
            e.preventDefault();
            loadArticle(article.file);
          };
          tocContainer.appendChild(link);
        });
      });
    }
  });
}

loadTOC();
