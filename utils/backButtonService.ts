type BackHandler = () => boolean;

const handlers: BackHandler[] = [];

export function addBackHandler(handler: BackHandler) {
  handlers.push(handler);
  return () => removeBackHandler(handler);
}

export function removeBackHandler(handler: BackHandler) {
  const idx = handlers.indexOf(handler);
  if (idx >= 0) handlers.splice(idx, 1);
}

export function handleBackHandlers(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) {
    try {
      const handled = handlers[i]();
      if (handled) return true;
    } catch (e) {
      console.error("Back handler threw", e);
    }
  }
  return false;
}
