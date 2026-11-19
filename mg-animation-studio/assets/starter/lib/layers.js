// Decode the project's still assets once, before the first deterministic frame.
export function loadLayers(sources = {}) {
  const assets = new URL('./assets/', document.baseURI);
  const images = Object.entries(sources).map(async ([key, source]) => {
    const url = new URL(source, document.baseURI);
    const local = url.origin === assets.origin && url.pathname.startsWith(assets.pathname);
    const embedded = /^data:image\/(png|jpeg|webp);base64,/.test(url.href);
    if (!local && !embedded) throw Error(`Layer "${key}" must be a project-local asset`);
    const image = new Image();
    image.src = url.href;
    try {
      await image.decode();
    } catch (cause) {
      throw Error(`Layer "${key}" could not be decoded`, {cause});
    }
    return [key, image];
  });
  return Promise.all(images).then(Object.fromEntries);
}

export function paintLayer(g, image, x, y, width, height, opacity = 1) {
  g.save();
  try {
    g.globalAlpha *= opacity;
    g.drawImage(image, x, y, width, height);
  } finally {
    g.restore();
  }
}
