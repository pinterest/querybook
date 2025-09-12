// Module-level state and subscription logic
let _isFocused = document.hasFocus();
const listeners: Set<() => void> = new Set();

function notifyAll() {
    for (const listener of listeners) {
        listener();
    }
}

function setFocus(newVal: boolean) {
    if (_isFocused !== newVal) {
        _isFocused = newVal;
        notifyAll();
    }
}

function onFocus() {
    setFocus(true);
}
function onBlur() {
    setFocus(false);
}
function onVisibility() {
    setFocus(document.visibilityState === 'visible' && document.hasFocus());
}

let initialized = false;
function ensureListeners() {
    if (initialized) {
        return;
    }
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    initialized = true;
}

ensureListeners();

export function isWindowFocused() {
    return _isFocused;
}
