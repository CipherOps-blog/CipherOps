const normalizeBasePath = (siteBasePath = '/') => {
  if (!siteBasePath || siteBasePath === '/') return '/';
  return siteBasePath.endsWith('/') ? siteBasePath : `${siteBasePath}/`;
};

const getSiteBasePath = (baseUrl) => {
  try {
    const parsedBaseUrl = new URL(baseUrl);
    const segments = parsedBaseUrl.pathname.split('/').filter(Boolean);

    if (segments.length === 0) return '/';

    const firstSegment = segments[0];
    return normalizeBasePath(`/${firstSegment}/`);
  } catch (error) {
    return '/';
  }
};

export const resolveAssetUrl = (value, baseUrl) => {
  if (!value) return value;
  if (value.startsWith('#')) return value;
  if (/^(?:[a-z]+:)?\/\//i.test(value) || /^[a-z]+:/i.test(value) || value.startsWith('data:')) return value;

  if (value.startsWith('/')) {
    const siteBasePath = getSiteBasePath(baseUrl);
    return new URL(value.replace(/^\/+/, ''), `${new URL(baseUrl).origin}${siteBasePath}`).href;
  }

  return new URL(value, baseUrl).href;
};
