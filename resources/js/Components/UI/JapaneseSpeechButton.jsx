import React, { useEffect, useMemo, useState } from 'react';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const canUseSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

const chooseJapaneseVoice = () => {
    if (!canUseSpeech()) return null;

    return window.speechSynthesis
        .getVoices()
        .find((voice) => voice.lang?.toLowerCase().startsWith('ja'));
};

export default function JapaneseSpeechButton({
    text,
    audioUrl = null,
    className = '',
    iconClassName = '',
    title = 'Dengarkan pelafalan',
    rate = 0.9,
    pitch = 1,
    volume = 1,
    children = null,
    ...buttonProps
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [voiceReady, setVoiceReady] = useState(false);

    const speakableText = useMemo(() => String(text || '').trim(), [text]);
    const supported = Boolean(audioUrl) || (canUseSpeech() && speakableText.length > 0);

    useEffect(() => {
        if (!canUseSpeech()) return undefined;

        const loadVoices = () => setVoiceReady(true);
        loadVoices();
        window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);

        return () => {
            window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
            window.speechSynthesis.cancel();
        };
    }, []);

    const play = async (event) => {
        event?.stopPropagation?.();

        if (!supported) return;

        if (audioUrl) {
            window.speechSynthesis?.cancel?.();
            setIsPlaying(true);

            const audio = new Audio(audioUrl);
            audio.onended = () => setIsPlaying(false);
            audio.onerror = () => setIsPlaying(false);
            await audio.play().catch(() => setIsPlaying(false));
            return;
        }

        if (!canUseSpeech()) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(speakableText);
        utterance.lang = 'ja-JP';
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        const voice = chooseJapaneseVoice();
        if (voice) {
            utterance.voice = voice;
        }

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        window.speechSynthesis.speak(utterance);
    };

    return (
        <button
            type="button"
            onClick={play}
            disabled={!supported}
            title={supported ? title : 'Narator tidak tersedia di browser ini'}
            aria-label={supported ? title : 'Narator tidak tersedia'}
            className={`${className} ${!supported ? 'cursor-not-allowed opacity-45' : ''}`}
            data-voice-ready={voiceReady ? 'true' : 'false'}
            {...buttonProps}
        >
            {children || (
                isPlaying
                    ? <VolumeUpIcon className={iconClassName} />
                    : supported ? <VolumeUpIcon className={iconClassName} /> : <VolumeOffIcon className={iconClassName} />
            )}
        </button>
    );
}
