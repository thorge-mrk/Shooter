export function resolveEffectiveInputMode({
  overrideMode = 'auto',
  hasTouch = false,
  pointerLocked = false,
  lastKeyboardAt = 0,
  lastMouseAt = 0,
  lastTouchAt = 0,
  now = 0
}) {
  if (overrideMode && overrideMode !== 'auto') {
    return overrideMode;
  }

  if (pointerLocked) {
    return 'desktop';
  }

  const recentMouse = lastMouseAt > 0 && now - lastMouseAt < 12000 && lastMouseAt > lastTouchAt;
  if (!hasTouch || recentMouse) {
    return 'desktop';
  }

  const recentKeyboard = lastKeyboardAt > 0 && now - lastKeyboardAt < 25000;
  if (hasTouch && recentKeyboard) {
    return 'hybrid';
  }

  return 'touch';
}
