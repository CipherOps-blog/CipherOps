const manifestPath = 'manifest.json';
const tocRootId = 'toc';
let currentActiveLink = null;

const fetchManifest = async () => {
  const response = await fetch(manifestPath, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Failed to fetch manifest: ${response.statusText}`);
  }
  return response.json();
};

const closeMobileTOC = () => {
  if (window.innerWidth <= 768) {
    const toc = document.getElementById(tocRootId);
    if (toc) {
      toc.classList.remove('open');
    }
  }
};

const setActiveLink = (link) => {
  if (currentActiveLink) {
    currentActiveLink.classList.remove('active');
  }
  currentActiveLink = link;
  if (currentActiveLink) {
    currentActiveLink.classList.add('active');
  }
};

const handleCategoryToggle = (categoryEl) => {
  categoryEl.classList.toggle('collapsed');
};

const createArticleLink = (article) => {
  const link = document.createElement('a');
  link.className = 'toc-article';
  link.href = `#article=${encodeURIComponent(article.file)}`;
  link.dataset.file = article.file;
  link.innerHTML = `<span class="toc-article-title">${article.title}</span>`;

  link.addEventListener('click', (event) => {
    event.preventDefault();
    const file = article.file;
    if (typeof loadArticle === 'function') {
      loadArticle(file);
    }
    setActiveLink(link);
    closeMobileTOC();
  });

  return link;
};

const createCategoryNode = (category) => {
  const categoryWrapper = document.createElement('div');
  categoryWrapper.className = 'toc-category';
  categoryWrapper.setAttribute('aria-expanded', 'true');

  const categoryHeader = document.createElement('button');
  categoryHeader.type = 'button';
  categoryHeader.className = 'toc-category-header';
  categoryHeader.textContent = category.category;
  categoryHeader.addEventListener('click', () => {
    handleCategoryToggle(categoryWrapper);
  });

  const articleList = document.createElement('div');
  articleList.className = 'toc-article-list';

  category.articles.forEach((article) => {
    const item = document.createElement('div');
    item.className = 'toc-article-item';
    const link = createArticleLink(article);
    item.appendChild(link);
    articleList.appendChild(item);
  });

  categoryWrapper.appendChild(categoryHeader);
  categoryWrapper.appendChild(articleList);
  return categoryWrapper;
};

const buildTOC = async () => {
  const tocRoot = document.getElementById(tocRootId);
  if (!tocRoot) {
    console.warn(`TOC root element with id '${tocRootId}' not found.`);
    return;
  }

  tocRoot.innerHTML = '';

  try {
    const manifest = await fetchManifest();
    manifest.forEach((category) => {
      const categoryNode = createCategoryNode(category);
      tocRoot.appendChild(categoryNode);
    });
  } catch (error) {
    console.error('Error building TOC:', error);
    tocRoot.textContent = 'Unable to load table of contents.';
  }
};

window.addEventListener('DOMContentLoaded', buildTOC);

export { buildTOC };
