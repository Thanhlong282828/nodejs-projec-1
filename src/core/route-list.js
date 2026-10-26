// CLI-only: đọc route stack của Express 5, tương tự php artisan route:list.
export function listRoutes(app) {
  const rows = [];
  function visit(stack) {
    for (const layer of stack || []) {
      if (layer.route) {
        for (const method of Object.keys(layer.route.methods))
          if (layer.route.methods[method])
            rows.push({ method: method.toUpperCase(), url: layer.route.path });
      } else if (layer.handle?.stack) visit(layer.handle.stack);
    }
  }
  visit(app.router.stack);
  return rows;
}
