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
    renderPDFs();
    highlightCode();
    buildArticleTOC();

    requestAnimationFrame(() => {
      renderGraphs();
    });
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


const buildArticleTOC = () => {
  const articleContainer = document.getElementById(articleContainerId);
  const articleToc = document.getElementById('article-toc');
  if (!articleContainer || !articleToc) return;

  const headings = articleContainer.querySelectorAll('h1, h2, h3, h4');
  articleToc.innerHTML = '';

  if (headings.length === 0) {
    articleToc.style.display = 'none';
    return;
  }

  articleToc.style.display = '';

  const title = document.createElement('p');
  title.className = 'article-toc-title';
  title.textContent = 'On this page';
  articleToc.appendChild(title);

  headings.forEach((heading, i) => {
    if (!heading.id) {
      heading.id = `section-${i}-${heading.textContent
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')}`;
    }

    const label = heading.textContent.trim();

    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = label;
    link.className = `article-toc-link article-toc-${heading.tagName.toLowerCase()}`;
    link.title = label; /* full text on hover if truncated */

    link.addEventListener('click', (e) => {
      e.preventDefault();
      heading.scrollIntoView({ behavior: 'smooth' });
    });

    articleToc.appendChild(link);
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
    const paddingX = 16;
    const paddingY = 10;
    const fontSize = 12;
    const fontFamily = 'Georgia, serif';

    const measureText = (text) => {
      const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      tempSvg.style.visibility = 'hidden';
      tempSvg.style.position = 'absolute';
      document.body.appendChild(tempSvg);
      const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tempText.setAttribute('font-family', fontFamily);
      tempText.setAttribute('font-size', fontSize);
      tempText.textContent = text;
      tempSvg.appendChild(tempText);
      const w = tempText.getBBox().width;
      document.body.removeChild(tempSvg);
      return w;
    };

    const nodeMap = {};
    graphData.nodes.forEach((node) => {
      const textWidth = measureText(node.label || node.id);
      node.boxW = textWidth + paddingX * 2;
      node.boxH = fontSize + paddingY * 2;
      nodeMap[node.id] = node;
    });

    const isTree = () => {
      const parentCount = {};
      graphData.nodes.forEach((n) => { parentCount[n.id] = 0; });
      graphData.edges.forEach((e) => {
        parentCount[e.to] = (parentCount[e.to] || 0) + 1;
      });
      if (Object.values(parentCount).some((c) => c > 1)) return false;
      const roots = graphData.nodes.filter((n) => parentCount[n.id] === 0);
      if (roots.length !== 1) return false;

      const childrenMap = {};
      graphData.edges.forEach((e) => {
        if (!childrenMap[e.from]) childrenMap[e.from] = [];
        childrenMap[e.from].push(e.to);
      });
      const visited = new Set();
      const hasCycle = (id) => {
        if (visited.has(id)) return true;
        visited.add(id);
        for (const child of (childrenMap[id] || [])) {
          if (hasCycle(child)) return true;
        }
        visited.delete(id);
        return false;
      };
      return !hasCycle(roots[0].id);
    };

    const createSvg = (height) => {
      const svg = d3.create('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

      const arrowId = `arrow-${Math.random().toString(36).substr(2, 9)}`;
      svg.append('defs')
        .append('marker')
        .attr('id', arrowId)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#87A878');

      return { svg, arrowId };
    };

    const getRectBorderPoint = (sx, sy, tx, ty, boxW, boxH) => {
      const dx = tx - sx;
      const dy = ty - sy;
      const angle = Math.atan2(dy, dx);
      const halfW = boxW / 2;
      const halfH = boxH / 2;
      const absCos = Math.abs(Math.cos(angle));
      const absSin = Math.abs(Math.sin(angle));
      const t = (halfW * absSin <= halfH * absCos) ? halfW / absCos : halfH / absSin;
      return {
        x: tx - Math.cos(angle) * t,
        y: ty - Math.sin(angle) * t,
      };
    };

    const drawNodes = (svg, nodesData, getX, getY, getData) => {
      const nodeElements = svg.append('g')
        .selectAll('g')
        .data(nodesData)
        .enter()
        .append('g')
        .attr('transform', (d) => `translate(${getX(d)}, ${getY(d)})`)
        .attr('cursor', 'pointer')
        .on('click', (event, d) => {
          const data = getData(d);
          if (event.target.tagName === 'A') return;
          if (data.link) {
            if (data.link.startsWith('http')) {
              window.open(data.link, '_blank');
            } else {
              loadArticle(data.link);
            }
          }
        });

      nodeElements.append('rect')
        .attr('width', (d) => getData(d).boxW)
        .attr('height', (d) => getData(d).boxH)
        .attr('x', (d) => -getData(d).boxW / 2)
        .attr('y', (d) => -getData(d).boxH / 2)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', '#FFFFFF')
        .attr('stroke', '#87A878')
        .attr('stroke-width', 2);

      nodeElements.append('foreignObject')
        .attr('width', (d) => getData(d).boxW)
        .attr('height', (d) => getData(d).boxH)
        .attr('x', (d) => -getData(d).boxW / 2)
        .attr('y', (d) => -getData(d).boxH / 2)
        .append('xhtml:div')
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .style('font-family', fontFamily)
        .style('font-size', `${fontSize}px`)
        .style('color', '#000000')
        .style('text-align', 'center')
        .style('padding', '0 4px')
        .style('box-sizing', 'border-box')
        .style('pointer-events', 'auto')
        .html((d) => getData(d).html || getData(d).label || getData(d).id);

      return nodeElements;
    };

    const renderTree = () => {
      const levelHeight = 100;

      const childrenMap = {};
      const hasParent = new Set();
      graphData.edges.forEach((edge) => {
        if (!childrenMap[edge.from]) childrenMap[edge.from] = [];
        childrenMap[edge.from].push(edge.to);
        hasParent.add(edge.to);
      });

      const rootId = graphData.nodes.find((n) => !hasParent.has(n.id)).id;

      const buildHierarchy = (id) => {
        const node = { ...nodeMap[id] };
        if (childrenMap[id]) node.children = childrenMap[id].map(buildHierarchy);
        return node;
      };

      const hierarchyData = d3.hierarchy(buildHierarchy(rootId));

      const treeLayout = d3.tree().nodeSize([120, levelHeight]);
      treeLayout(hierarchyData);

      let minX = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      hierarchyData.each((d) => {
        if (d.x < minX) minX = d.x;
        if (d.x > maxX) maxX = d.x;
        if (d.y > maxY) maxY = d.y;
      });

      const treeWidth = maxX - minX;
      const height = maxY + levelHeight;

      const offsetX = (width / 2) - (treeWidth / 2) - minX;
      const offsetY = levelHeight / 2;
      hierarchyData.each((d) => {
        d.x += offsetX;
        d.y += offsetY;
      });

      const { svg, arrowId } = createSvg(height);

      svg.append('g')
        .selectAll('line')
        .data(hierarchyData.links())
        .enter()
        .append('line')
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => getRectBorderPoint(
          d.source.x, d.source.y,
          d.target.x, d.target.y,
          d.target.data.boxW, d.target.data.boxH,
        ).x)
        .attr('y2', (d) => getRectBorderPoint(
          d.source.x, d.source.y,
          d.target.x, d.target.y,
          d.target.data.boxW, d.target.data.boxH,
        ).y)
        .attr('stroke', '#B8A9C9')
        .attr('stroke-width', 1.5)
        .attr('marker-end', `url(#${arrowId})`);

      drawNodes(svg, hierarchyData.descendants(), (d) => d.x, (d) => d.y, (d) => d.data);

      graphDef.replaceWith(svg.node());
    };

    const renderForce = () => {
      const height = 420;

      const nodes = graphData.nodes.map((node, idx) => ({ ...node, index: idx }));
      const links = graphData.edges.map((edge) => ({
        source: edge.from,
        target: edge.to,
        directed: edge.directed,
      }));

      const maxBoxW = Math.max(...nodes.map((n) => n.boxW));
      const maxBoxH = Math.max(...nodes.map((n) => n.boxH));
      const collideRadius = Math.sqrt((maxBoxW / 2) ** 2 + (maxBoxH / 2) ** 2) + 10;

      const { svg, arrowId } = createSvg(height);

      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d) => d.id).distance(160).strength(0.5))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide(collideRadius));

      const edgeElements = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', '#B8A9C9')
        .attr('stroke-width', 1.5)
        .attr('marker-end', (d) => (d.directed ? `url(#${arrowId})` : null));

      const nodeElements = drawNodes(svg, nodes, (d) => d.x || 0, (d) => d.y || 0, (d) => d);

      simulation.on('tick', () => {
        edgeElements
          .attr('x1', (d) => d.source.x)
          .attr('y1', (d) => d.source.y)
          .attr('x2', (d) => {
            if (!d.directed) return d.target.x;
            return getRectBorderPoint(
              d.source.x, d.source.y,
              d.target.x, d.target.y,
              d.target.boxW, d.target.boxH,
            ).x;
          })
          .attr('y2', (d) => {
            if (!d.directed) return d.target.y;
            return getRectBorderPoint(
              d.source.x, d.source.y,
              d.target.x, d.target.y,
              d.target.boxW, d.target.boxH,
            ).y;
          });

        nodeElements.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
      });

      simulation.alpha(1).restart();
      setTimeout(() => simulation.stop(), 800);

      graphDef.replaceWith(svg.node());
    };

    if (isTree()) {
      renderTree();
    } else {
      renderForce();
    }
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
  const articleToc = document.getElementById('article-toc');
  if (!articleContainer || !landing) return;

  articleContainer.style.display = 'none';
  landing.style.display = 'block';

  if (articleToc) {
    articleToc.innerHTML = '';
    articleToc.style.display = 'none';
  }

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
  container.querySelectorAll('.article-hex').forEach((el) => el.remove());
  container.appendChild(makeHexSVG(72, '#87A878', 'article-hex-tl-1'));
  container.appendChild(makeHexSVG(72, '#B8A9C9', 'article-hex-tl-2'));
  container.appendChild(makeHexSVG(72, '#B8A9C9', 'article-hex-tr-1'));
  container.appendChild(makeHexSVG(72, '#87A878', 'article-hex-tr-2'));
};


export { loadArticle, showLanding };
