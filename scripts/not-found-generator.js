'use strict';

function hasNotFoundPage(locals) {
  if (!locals.pages || !locals.pages.some) return false;

  return locals.pages.some((page) => {
    const path = String((page && page.path) || '').replace(/^\/+/, '');
    return path === '404.html' || path === '404/index.html';
  });
}

hexo.extend.generator.register('midnight_not_found', function midnightNotFound(locals) {
  if (hasNotFoundPage(locals)) return [];

  return [{
    path: '404.html',
    layout: ['404', 'page', 'index'],
    data: {
      title: 'Page Not Found',
      path: '404.html',
      comments: false
    }
  }];
});
