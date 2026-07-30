export const SOUND_EFFECTS_PREFERENCE_KEY = 'japanlingo.soundEffectsEnabled';

const SOUND_EFFECTS = {
    correct: { src: '/audio/sfx/Audio/confirmation_001.ogg', volume: 0.38 },
    incorrect: { src: '/audio/sfx/Audio/error_001.ogg', volume: 0.3 },
    complete: { src: '/audio/sfx/Audio/maximize_001.ogg', volume: 0.42 },
    open: { src: '/audio/sfx/Audio/open_001.ogg', volume: 0.24 },
    close: { src: '/audio/sfx/Audio/close_001.ogg', volume: 0.2 },
    select: { src: '/audio/sfx/Audio/select_001.ogg', volume: 0.24 },
};

const players = new Map();

export function areSoundEffectsEnabled() {
    if (typeof window === 'undefined') return true;

    return window.localStorage.getItem(SOUND_EFFECTS_PREFERENCE_KEY) !== 'false';
}

export function setSoundEffectsEnabled(enabled) {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(SOUND_EFFECTS_PREFERENCE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('japanlingo:sound-effects-changed'));
}

export function playSoundEffect(name) {
    if (!areSoundEffectsEnabled() || typeof Audio === 'undefined') return;

    const effect = SOUND_EFFECTS[name];
    if (!effect) return;

    let player = players.get(name);
    if (!player) {
        player = new Audio(effect.src);
        player.preload = 'auto';
        player.volume = effect.volume;
        players.set(name, player);
    }

    player.currentTime = 0;
    player.play().catch(() => {
        // Browsers may block audio until the user has interacted with the page.
    });
}
