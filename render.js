const articleContainerId = 'article-container';
const landingId = 'landing';
const contentPanelId = 'main-content';

const loadArticle = async (filePath) => {
  const articleContainer = document.getElementById(articleContainerId);
  const landing = document.getElementById(landingId);
  const contentPanel = document.getElementById(contentPanelId);
  if (!articleContainer || !landing || !contentPanel) return;

  try {
    const response = await fetch(filePath, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Unable to load article: ${response.statusText}`);
    }

    const markdown = await response.text();
    const html = typeof marked === 'function' ? marked.parse(markdown) : '';

    articleContainer.innerHTML = html;
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
    if (articleContainer) {
      articleContainer.innerHTML = `<p>Failed to load article.</p>`;
      articleContainer.style.display = 'block';
      landing.style.display = 'none';
    }
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
  codeBlocks.forEach((block) => {
    hljs.highlightElement(block);
  });
};

const renderGraphs = () => {
  const articleContainer = document.getElementById(articleContainerId);
  if (!articleContainer || typeof d3 === 'undefined') return;

  const graphDefs = Array.from(articleContainer.querySelectorAll('.graph-definition'));
  graphDefs.forEach((graphDef) => {
    const jsonText = graphDef.textContent.trim();
    let graphData;
    try {
      graphData = JSON.parse(jsonText);
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
    defs.append('marker')
      .attr('id', `arrow-${Math.random().toString(36).substr(2, 9)}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#87A878');

    const nodes = graphData.nodes.map((node, idx) => ({
      ...node,
      index: idx,
    }));
    const links = graphData.edges.map((edge) => ({
      source: edge.from,
      target: edge.to,
      directed: edge.directed,
    }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(140).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(40));

    const linkGroup = svg.append('g').attr('class', 'graph-links');
    const edgeElements = linkGroup.selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', '#B8A9C9')
      .attr('stroke-width', 1.5)
      .attr('marker-end', (d) => (d.directed ? `url(#${defs.select('marker').attr('id')})` : null));

    const nodeGroup = svg.append('g').attr('class', 'graph-nodes');
    const nodeElements = nodeGroup.selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        if (d.link) {
          if (d.link.startsWith('http')) {
            window.open(d.link, '_blank');
          } else {
            loadArticle(d.link);
          }
        }
      });

    nodeElements.append('circle')
      .attr('r', 22)
      .attr('fill', '#FFFFFF')
      .attr('stroke', '#87A878')
      .attr('stroke-width', 2);

    nodeElements.append('text')
      .text((d) => d.label || d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-family', 'Georgia, serif')
      .attr('font-size', 12)
      .attr('fill', '#000000');

    simulation.on('tick', () => {
      edgeElements.attr('d', (d) => {
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;
        return `M${sourceX},${sourceY} L${targetX},${targetY}`;
      });

      nodeElements.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
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
  if (typeof pdfjsLib === 'undefined' || !pdfjsLib.getDocument) {
    container.innerHTML = '<p>PDF preview is unavailable.</p>';
    return;
  }

  const pdfContainer = document.createElement('div');
  pdfContainer.style.display = 'grid';
  pdfContainer.style.gap = '1rem';

  try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.25 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport }).promise;
      pdfContainer.appendChild(canvas);
    }
  } catch (error) {
    pdfContainer.innerHTML = `<p>Unable to render PDF: ${error.message}</p>`;
  }

  container.appendChild(pdfContainer);
};

const renderPDFs = () => {
  const articleContainer = document.getElementById(articleContainerId);
  if (!articleContainer) return;

  const embeds = Array.from(articleContainer.querySelectorAll('.pdf-embed'));
  embeds.forEach(async (embed) => {
    const src = embed.dataset.src;
    if (!src) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-wrapper';
    wrapper.style.display = 'grid';
    wrapper.style.gap = '0.75rem';
    wrapper.style.margin = '1.5rem 0';

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.width = '100%';
    iframe.height = '600';
    iframe.style.border = '1px solid rgba(135, 168, 120, 0.3)';
    iframe.style.borderRadius = '12px';
    iframe.style.minHeight = '420px';

    const button = document.createElement('a');
    button.href = src;
    button.textContent = 'Download PDF';
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.padding = '0.85rem 1.25rem';
    button.style.background = '#87A878';
    button.style.color = '#FFFFFF';
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

  const activeLinks = document.querySelectorAll('.toc-article.active');
  activeLinks.forEach((link) => link.classList.remove('active'));
};

const loadArticleFromHash = () => {
  const hash = window.location.hash;
  if (!hash.startsWith('#article=')) return;
  const filePath = decodeURIComponent(hash.slice('#article='.length));
  if (!filePath) return;
  loadArticle(filePath);
};

const whenReady = (callback) => {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
};

window.addEventListener('hashchange', loadArticleFromHash);
whenReady(loadArticleFromHash);

window.loadArticle = loadArticle;
window.showLanding = showLanding;

export { loadArticle, showLanding };
