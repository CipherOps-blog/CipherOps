const articleContainerId = 'article-container';
const landingId = 'landing';
const contentPanelId = 'main-content';

const loadArticle = async (filePath) => {
  const articleContainer = document.getElementById(articleContainerId);
  const landing = document.getElementById(landingId);
  const contentPanel = document.getElementById(contentPanelId);
  if (!articleContainer || !landing || !contentPanel) return;

  try {
    const baseUrl = window.location.href.split('#')[0];
    const articleUrl = new URL(filePath, baseUrl).href;
    const response = await fetch(articleUrl, { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(`Unable to load article: ${response.statusText} (${articleUrl})`);
    }

    const markdown = await response.text();
    const html = marked && marked.parse ? marked.parse(markdown) : markdown;

    articleContainer.innerHTML = html;

    injectArticleHexagons(articleContainer);

    landing.style.display = 'none';
    articleContainer.style.display = 'block';

    articleContainer.classList.remove('fade-in');
    void articleContainer.offsetWidth;
    articleContainer.classList.add('fade-in');

    contentPanel.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    await renderMath();
    renderGraphs();
    renderPDFs();
    highlightCode();
  } catch (error) {
    console.error(error);
    articleContainer.innerHTML = `<p>Failed to load article.</p>`;
    articleContainer.style.display = 'block';
    landing.style.display = 'none';
  }
};

const renderMath = async () => {
  const articleContainer = document.getElementById(articleContainerId);
  if (!articleContainer || typeof MathJax === 'undefined' || !MathJax.typesetPromise) return;

  try {
    await MathJax.typesetPromise([articleContainer]);
  } catch (error) {
    console.warn('MathJax rendering failed:', error);
  }
};

const highlightCode = () => {
  const articleContainer = document.getElementById(articleContainerId);
  if (!articleContainer || typeof hljs === 'undefined') return;

  const codeBlocks = articleContainer.querySelectorAll('pre code');
  codeBlocks.forEach((block) => hljs.highlightElement(block));
};

const renderGraphs = () => {
  const articleContainer = document.getElementById(articleContainerId);
  if (!articleContainer || typeof d3 === 'undefined') return;

  const graphDefs = Array.from(articleContainer.querySelectorAll('.graph-definition'));

  graphDefs.forEach((graphDef) => {
    let graphData;
    try {
      graphData = JSON.parse(graphDef.textContent.trim());
    } catch (error) {
      console.warn('Invalid graph JSON:', error);
      return;
    }

    const width = graphDef.clientWidth || 720;
    const height = 420;

    const svg = d3.create('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');

    const defs = svg.append('defs');

    const markerId = `arrow-${Math.random().toString(36).slice(2)}`;

    defs.append('marker')
      .attr('id', markerId)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#87A878');

    const nodes = graphData.nodes.map((node, idx) => ({ ...node, index: idx }));
    const links = graphData.edges.map((edge) => ({
      source: edge.from,
      target: edge.to,
      directed: edge.directed,
    }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(140).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(40));

    const linkGroup = svg.append('g');

    const edgeElements = linkGroup.selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', '#B8A9C9')
      .attr('stroke-width', 1.5)
      .attr('marker-end', d => d.directed ? `url(#${markerId})` : null);

    const nodeGroup = svg.append('g');

    const nodeElements = nodeGroup.selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        if (!d.link) return;
        if (d.link.startsWith('http')) window.open(d.link, '_blank');
        else loadArticle(d.link);
      });

    nodeElements.append('circle')
      .attr('r', 22)
      .attr('fill', '#fff')
      .attr('stroke', '#87A878')
      .attr('stroke-width', 2);

    nodeElements.append('text')
      .text(d => d.label || d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-family', 'Georgia, serif')
      .attr('font-size', 12);

    simulation.on('tick', () => {
      edgeElements.attr('d', d => `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`);
      nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    simulation.alpha(1).restart();
    setTimeout(() => simulation.stop(), 800);

    graphDef.replaceWith(svg.node());
  });
};

const supportsPdfIframe = () => {
  if (typeof navigator === 'undefined' || !navigator.mimeTypes) return false;
  return !!navigator.mimeTypes['application/pdf'];
};

const renderPDFUsingPDFJS = async (url, container) => {
  if (typeof pdfjsLib === 'undefined') {
    container.innerHTML = '<p>PDF preview is unavailable.</p>';
    return;
  }

  const pdfContainer = document.createElement('div');
  pdfContainer.style.display = 'grid';
  pdfContainer.style.gap = '1rem';

  try {
    const pdf = await pdfjsLib.getDocument(url).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.25 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: canvas.getContext('2d'),
        viewport,
      }).promise;

      pdfContainer.appendChild(canvas);
    }
  } catch (err) {
    pdfContainer.innerHTML = `<p>Unable to render PDF: ${err.message}</p>`;
  }

  container.appendChild(pdfContainer);
};

const renderPDFs = () => {
  const articleContainer = document.getElementById(articleContainerId);
  if (!articleContainer) return;

  const embeds = articleContainer.querySelectorAll('.pdf-embed');

  embeds.forEach(async (embed) => {
    const src = embed.dataset.src;
    if (!src) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-wrapper';

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.width = '100%';
    iframe.height = '600';
    iframe.style.border = '1px solid rgba(135,168,120,0.3)';
    iframe.style.borderRadius = '12px';

    const button = document.createElement('a');
    button.href = src;
    button.textContent = 'Download PDF';
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
    button.style.display = 'inline-flex';
    button.style.padding = '0.85rem 1.25rem';
    button.style.background = '#87A878';
    button.style.color = '#fff';
    button.style.borderRadius = '999px';
    button.style.textDecoration = 'none';
    button.style.width = 'fit-content';

    wrapper.appendChild(iframe);
    wrapper.appendChild(button);

    embed.replaceWith(wrapper);

    if (!supportsPdfIframe()) {
      wrapper.removeChild(iframe);
      await renderPDFUsingPDFJS(src, wrapper);
    }
  });
};

const showLanding = () => {
  const articleContainer = document.getElementById(articleContainerId);
  const landing = document.getElementById(landingId);
  if (!articleContainer || !landing) return;

  articleContainer.style.display = 'none';
  landing.style.display = 'block';

  document.querySelectorAll('.toc-article.active')
    .forEach(el => el.classList.remove('active'));
};

const loadArticleFromHash = () => {
  const hash = window.location.hash;
  if (!hash.startsWith('#article=')) return;

  const filePath = decodeURIComponent(hash.replace('#article=', ''));
  if (filePath) loadArticle(filePath);
};

const whenReady = (cb) => {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', cb);
  } else cb();
};

window.addEventListener('hashchange', loadArticleFromHash);
whenReady(loadArticleFromHash);

window.loadArticle = loadArticle;
window.showLanding = showLanding;

/* ---------------- HEX BACKGROUND FIX ---------------- */

const makeHexSVG = (size, strokeColour, extraClass) => {
  const r = size / 2;

  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + Math.cos(angle) * r},${r + Math.sin(angle) * r}`;
  }).join(' ');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.classList.add('article-hex', extraClass);

  const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  poly.setAttribute('points', points);
  poly.setAttribute('fill', 'none');
  poly.setAttribute('stroke', strokeColour);
  poly.setAttribute('stroke-width', '2');

  svg.appendChild(poly);
  return svg;
};

const injectArticleHexagons = (container) => {
  let layer = container.querySelector('.article-hex-layer');

  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'article-hex-layer';
    container.prepend(layer);
  }

  layer.innerHTML = '';

  layer.appendChild(makeHexSVG(72, '#87A878', 'tl1'));
  layer.appendChild(makeHexSVG(72, '#B8A9C9', 'tl2'));
  layer.appendChild(makeHexSVG(72, '#B8A9C9', 'tr1'));
  layer.appendChild(makeHexSVG(72, '#87A878', 'tr2'));
};

export { loadArticle, showLanding };
