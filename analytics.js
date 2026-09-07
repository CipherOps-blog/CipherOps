const GOATCOUNTER_CODE = 'latticewalker';

const SCRIPT_SRC = 'https://gc.zgo.at/count.js';

const REPO_BASE = '/CipherOps';

const slugSegment = (segment) =>
  segment
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const articlePath = (filePath) =>
  '/' +
  filePath
    .replace(/\.md$/i, '')
    .split('/')
    .map(slugSegment)
    .filter(Boolean)
    .join('/');

const pagePath = () => {
  let path = location.pathname;
  if (path.startsWith(REPO_BASE)) path = path.slice(REPO_BASE.length);
  path = path.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
  return path || '/';
};

const currentPath = () => {
  const hash = location.hash;
  if (hash.startsWith('#article=')) {
    const filePath = decodeURIComponent(hash.slice('#article='.length));
    if (filePath) return articlePath(filePath);
  }
  return pagePath();
};

let ready = false;
const pending = [];

const send = (vars) => {
  if (ready) window.goatcounter.count(vars);
  else pending.push(vars);
};

const init = () => {
  if (GOATCOUNTER_CODE === 'YOUR-CODE') {
    console.warn('[analytics] GOATCOUNTER_CODE is unset — tracking disabled.');
    return;
  }

  window.goatcounter = Object.assign({}, window.goatcounter, { no_onload: true });

  const script = document.createElement('script');
  script.async = true;
  script.src = SCRIPT_SRC;
  script.setAttribute('data-goatcounter', `https://${GOATCOUNTER_CODE}.goatcounter.com/count`);
  script.addEventListener('load', () => {
    ready = true;
    while (pending.length) window.goatcounter.count(pending.shift());
  });

  script.addEventListener('error', () => { pending.length = 0; });
  document.head.appendChild(script);

  let lastPath = null;
  const record = () => {
    const path = currentPath();
    if (path === lastPath) return;
    lastPath = path;
    send({ path });
  };

  record();
  window.addEventListener('hashchange', record);
};

init();
