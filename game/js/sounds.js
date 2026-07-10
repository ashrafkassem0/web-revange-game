'use strict';
// =========================================================
//  SFX — Web Audio procedural sounds (extended, not rewritten)
// =========================================================
const SFX = (() => {
    let ctx = null;
    let masterGain = null;
    let sfxBus = null;
    let ambientBus = null;
    let audioReady = true;

    const state = {
        master: 1,
        sfx: 1,
        ambient: 1,
        quran: 0.9,
        muted: false
    };

    let rainLoop = null;
    let rainWanted = false;
    let cityAmbientLoop = null;
    let cityAmbientWanted = false;
    let pageHidden = false;

    const cooldownUntil = { arrow: 0, sword: 0 };
    const COOLDOWN_MS = { arrow: 100, sword: 300 };

    function getCtx() {
        if (!audioReady) return null;
        try {
            if (!ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) {
                    audioReady = false;
                    return null;
                }
                ctx = new AC();
                masterGain = ctx.createGain();
                sfxBus = ctx.createGain();
                ambientBus = ctx.createGain();
                sfxBus.connect(masterGain);
                ambientBus.connect(masterGain);
                masterGain.connect(ctx.destination);
                applyGains();
            }
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
            return ctx;
        } catch (_) {
            audioReady = false;
            return null;
        }
    }

    function clamp01(v) {
        v = Number(v);
        if (!isFinite(v)) return 0;
        return Math.max(0, Math.min(1, v));
    }

    function applyGains() {
        const m = state.muted ? 0 : state.master;
        if (masterGain) masterGain.gain.value = m;
        if (sfxBus) sfxBus.gain.value = state.sfx;
        if (ambientBus) ambientBus.gain.value = state.ambient;
        // Soft-mute rain while tab is hidden without tearing down the loop
        if (rainLoop && rainLoop.gain) {
            const c = ctx;
            const target = pageHidden ? 0.0001 : 0.06;
            if (c) {
                rainLoop.gain.gain.cancelScheduledValues(c.currentTime);
                rainLoop.gain.gain.setTargetAtTime(target, c.currentTime, 0.05);
            } else {
                rainLoop.gain.gain.value = target;
            }
        }
        // Soft-mute city ambient while tab is hidden
        if (cityAmbientLoop && cityAmbientLoop.gain) {
            const c = ctx;
            const target = pageHidden ? 0.0001 : 0.025;
            if (c) {
                cityAmbientLoop.gain.gain.cancelScheduledValues(c.currentTime);
                cityAmbientLoop.gain.gain.setTargetAtTime(target, c.currentTime, 0.05);
            } else {
                cityAmbientLoop.gain.gain.value = target;
            }
        }
    }

    function persistAudio() {
        try {
            if (typeof GameState !== 'undefined' && GameState.save) {
                GameState.save('audio', {
                    master: state.master,
                    sfx: state.sfx,
                    ambient: state.ambient,
                    quran: state.quran,
                    muted: state.muted
                });
            }
        } catch (_) { /* ignore */ }
    }

    function loadPersisted() {
        try {
            if (typeof GameState === 'undefined' || !GameState.load) return;
            const saved = GameState.load('audio', null);
            if (!saved || typeof saved !== 'object') return;
            if (saved.master != null) state.master = clamp01(saved.master);
            if (saved.sfx != null) state.sfx = clamp01(saved.sfx);
            if (saved.ambient != null) state.ambient = clamp01(saved.ambient);
            if (saved.quran != null) state.quran = clamp01(saved.quran);
            if (saved.muted != null) state.muted = !!saved.muted;
            applyGains();
            if (typeof QuranAyahs !== 'undefined' && QuranAyahs.applyVolume) {
                QuranAyahs.applyVolume();
            }
        } catch (_) { /* ignore */ }
    }

    function canPlaySfx() {
        if (state.muted || pageHidden) return false;
        return !!getCtx();
    }

    function playTone(freq, duration, type, volume, fadeOut) {
        if (type === undefined) type = 'sine';
        if (volume === undefined) volume = 0.3;
        if (fadeOut === undefined) fadeOut = true;
        if (!canPlaySfx()) return;
        const c = getCtx();
        if (!c) return;
        try {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, c.currentTime);
            gain.gain.setValueAtTime(volume, c.currentTime);
            if (fadeOut) {
                gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
            }
            osc.connect(gain);
            gain.connect(sfxBus);
            osc.start();
            osc.stop(c.currentTime + duration);
        } catch (_) { /* silent */ }
    }

    function noise(duration, volume) {
        if (volume === undefined) volume = 0.1;
        if (!canPlaySfx()) return;
        const c = getCtx();
        if (!c) return;
        try {
            const bufferSize = c.sampleRate * duration;
            const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const source = c.createBufferSource();
            source.buffer = buffer;
            const gain = c.createGain();
            gain.gain.setValueAtTime(volume, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

            const filter = c.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1000;

            source.connect(filter);
            filter.connect(gain);
            gain.connect(sfxBus);
            source.start();
        } catch (_) { /* silent */ }
    }

    function gated(kind, fn) {
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (now < (cooldownUntil[kind] || 0)) return;
        cooldownUntil[kind] = now + (COOLDOWN_MS[kind] || 0);
        fn();
    }

    function startRainInternal() {
        if (rainLoop) {
            applyGains();
            return;
        }
        const c = getCtx();
        if (!c || !ambientBus) return;
        try {
            const bufferSize = c.sampleRate * 2;
            const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const source = c.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            const filter = c.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3000;
            filter.Q.value = 0.5;

            const gain = c.createGain();
            const level = (pageHidden || state.muted) ? 0.0001 : 0.06;
            gain.gain.value = level;

            source.connect(filter);
            filter.connect(gain);
            gain.connect(ambientBus);
            source.start();
            rainLoop = { source, gain };
            applyGains();
        } catch (_) { /* silent */ }
    }

    function stopRainInternal(immediate) {
        if (!rainLoop) return;
        try {
            const c = getCtx();
            const loop = rainLoop;
            rainLoop = null;
            if (immediate || !c) {
                try { loop.source.stop(); } catch (_) {}
                return;
            }
            loop.gain.gain.cancelScheduledValues(c.currentTime);
            loop.gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1);
            setTimeout(() => {
                try { loop.source.stop(); } catch (_) {}
            }, 1000);
        } catch (_) {
            rainLoop = null;
        }
    }

    function startCityAmbientInternal() {
        if (cityAmbientLoop) {
            applyGains();
            return;
        }
        const c = getCtx();
        if (!c || !ambientBus) return;
        try {
            const bufferSize = c.sampleRate * 2;
            const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const source = c.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            const filter = c.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;
            filter.Q.value = 1.5;

            const gain = c.createGain();
            const level = (pageHidden || state.muted) ? 0.0001 : 0.025;
            gain.gain.value = level;

            source.connect(filter);
            filter.connect(gain);
            gain.connect(ambientBus);
            source.start();
            cityAmbientLoop = { source, gain };
            applyGains();
        } catch (_) { /* silent */ }
    }

    function stopCityAmbientInternal(immediate) {
        if (!cityAmbientLoop) return;
        try {
            const c = getCtx();
            const loop = cityAmbientLoop;
            cityAmbientLoop = null;
            if (immediate || !c) {
                try { loop.source.stop(); } catch (_) {}
                return;
            }
            loop.gain.gain.cancelScheduledValues(c.currentTime);
            loop.gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1);
            setTimeout(() => {
                try { loop.source.stop(); } catch (_) {}
            }, 1000);
        } catch (_) {
            cityAmbientLoop = null;
        }
    }

    // Visibility: quiet ambient while hidden; resume if rain/city still wanted
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            pageHidden = !!document.hidden;
            if (pageHidden) {
                applyGains();
            } else {
                applyGains();
                if (rainWanted && !rainLoop) startRainInternal();
                if (cityAmbientWanted && !cityAmbientLoop) startCityAmbientInternal();
            }
        });
    }

    // Load saved volumes once GameState is available (shared.js loads first)
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadPersisted);
        } else {
            loadPersisted();
        }
    }

    const api = {
        get rainLoop() { return rainLoop; },
        set rainLoop(v) { rainLoop = v; },

        setMasterVolume(v) {
            state.master = clamp01(v);
            applyGains();
            persistAudio();
            if (typeof QuranAyahs !== 'undefined' && QuranAyahs.applyVolume) {
                QuranAyahs.applyVolume();
            }
        },
        setSfxVolume(v) {
            state.sfx = clamp01(v);
            applyGains();
            persistAudio();
        },
        setAmbientVolume(v) {
            state.ambient = clamp01(v);
            applyGains();
            persistAudio();
        },
        setQuranVolume(v) {
            state.quran = clamp01(v);
            persistAudio();
            if (typeof QuranAyahs !== 'undefined' && QuranAyahs.applyVolume) {
                QuranAyahs.applyVolume();
            }
        },
        getMasterVolume() { return state.master; },
        getSfxVolume() { return state.sfx; },
        getAmbientVolume() { return state.ambient; },
        getQuranVolume() { return state.quran; },

        mute(on) {
            state.muted = !!on;
            applyGains();
            persistAudio();
            if (typeof QuranAyahs !== 'undefined' && QuranAyahs.applyVolume) {
                QuranAyahs.applyVolume();
            }
        },
        toggleMute() {
            state.muted = !state.muted;
            applyGains();
            persistAudio();
            if (typeof QuranAyahs !== 'undefined' && QuranAyahs.applyVolume) {
                QuranAyahs.applyVolume();
            }
            return state.muted;
        },
        isMuted() { return state.muted; },

        /** Re-read GameState.flags.audio (e.g. after slot load). */
        loadSettings() { loadPersisted(); },

        // صوت إطلاق السهم
        arrow() {
            gated('arrow', () => {
                playTone(800, 0.15, 'sine', 0.2);
                setTimeout(() => playTone(1200, 0.1, 'sine', 0.1), 50);
            });
        },

        // صوت ضربة السيف
        sword() {
            gated('sword', () => {
                if (!canPlaySfx()) return;
                const c = getCtx();
                if (!c) return;
                try {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(200, c.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.2);
                    gain.gain.setValueAtTime(0.25, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
                    osc.connect(gain);
                    gain.connect(sfxBus);
                    osc.start();
                    osc.stop(c.currentTime + 0.2);
                    noise(0.1, 0.15);
                } catch (_) { /* silent */ }
            });
        },

        // صوت إصابة هدف
        hit() {
            playTone(300, 0.1, 'square', 0.2);
            setTimeout(() => playTone(200, 0.15, 'square', 0.15), 50);
            noise(0.08, 0.1);
        },

        // صوت موت عدو
        kill() {
            playTone(600, 0.1, 'square', 0.15);
            setTimeout(() => playTone(800, 0.1, 'square', 0.15), 80);
            setTimeout(() => playTone(1000, 0.2, 'sine', 0.1), 160);
        },

        // صوت جمع نقاط XP
        xp() {
            playTone(523, 0.1, 'sine', 0.15);
            setTimeout(() => playTone(659, 0.1, 'sine', 0.15), 100);
            setTimeout(() => playTone(784, 0.15, 'sine', 0.12), 200);
        },

        // صوت البرق / الرعد (ambient category via ambient bus when possible)
        thunder() {
            if (state.muted || pageHidden) return;
            const c = getCtx();
            if (!c) return;
            // Route thunder through ambient bus by temporarily using noise → ambient
            try {
                const playAmbNoise = (duration, volume) => {
                    const bufferSize = c.sampleRate * duration;
                    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                    const source = c.createBufferSource();
                    source.buffer = buffer;
                    const gain = c.createGain();
                    gain.gain.setValueAtTime(volume, c.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
                    const filter = c.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 800;
                    source.connect(filter);
                    filter.connect(gain);
                    gain.connect(ambientBus);
                    source.start();
                };
                playAmbNoise(1.5, 0.3);
                setTimeout(() => playAmbNoise(0.8, 0.15), 200);
            } catch (_) { /* silent */ }
        },

        startRain() {
            rainWanted = true;
            if (pageHidden) return; // will resume on visibility
            startRainInternal();
        },
        stopRain() {
            rainWanted = false;
            stopRainInternal(false);
        },

        // City ambient — soft wind/plaza hum
        startCityAmbient() {
            cityAmbientWanted = true;
            if (pageHidden) return;
            startCityAmbientInternal();
        },
        stopCityAmbient() {
            cityAmbientWanted = false;
            stopCityAmbientInternal(false);
        },

        // One-shot: quest completion chime
        cityChime() {
            if (!canPlaySfx()) return;
            playTone(880, 0.15, 'sine', 0.12);
            setTimeout(() => playTone(1108, 0.2, 'sine', 0.1), 120);
            setTimeout(() => playTone(1318, 0.3, 'sine', 0.08), 240);
        },

        // One-shot: portal whoosh
        portalWhoosh() {
            if (!canPlaySfx()) return;
            const c = getCtx();
            if (!c) return;
            try {
                const bufferSize = c.sampleRate * 0.4;
                const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
                }
                const source = c.createBufferSource();
                source.buffer = buffer;
                const filter = c.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(2000, c.currentTime);
                filter.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.3);
                filter.Q.value = 1;
                const gain = c.createGain();
                gain.gain.setValueAtTime(0.15, c.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
                source.connect(filter);
                filter.connect(gain);
                gain.connect(ambientBus);
                source.start();
                source.stop(c.currentTime + 0.4);
            } catch (_) { /* silent */ }
        },

        // صوت هجوم ملك الرعب
        bossAttack() {
            if (!canPlaySfx()) return;
            const c = getCtx();
            if (!c) return;
            try {
                const osc = c.createOscillator();
                const gain = c.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, c.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.4);
                gain.gain.setValueAtTime(0.3, c.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
                osc.connect(gain);
                gain.connect(sfxBus);
                osc.start();
                osc.stop(c.currentTime + 0.4);
                noise(0.3, 0.2);
            } catch (_) { /* silent */ }
        },

        // صوت تلقي ضربة (اللاعب يتأذى)
        playerHurt() {
            playTone(200, 0.15, 'square', 0.25);
            setTimeout(() => playTone(150, 0.2, 'square', 0.2), 100);
            noise(0.15, 0.15);
        },

        // صوت الانتصار
        victory() {
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                setTimeout(() => playTone(freq, 0.3, 'sine', 0.2), i * 200);
            });
            setTimeout(() => {
                playTone(1047, 0.8, 'sine', 0.15);
                playTone(784, 0.8, 'sine', 0.1);
                playTone(523, 0.8, 'sine', 0.1);
            }, 900);
        },

        // صوت الهزيمة
        defeat() {
            const notes = [400, 350, 300, 200];
            notes.forEach((freq, i) => {
                setTimeout(() => playTone(freq, 0.4, 'sine', 0.2), i * 250);
            });
        },

        // صوت الضغط على زر
        click() {
            playTone(600, 0.08, 'sine', 0.15);
            setTimeout(() => playTone(800, 0.06, 'sine', 0.1), 50);
        },

        // صوت ظهور ملك الرعب
        bossAppear() {
            if (!canPlaySfx()) return;
            const c = getCtx();
            if (!c) return;
            try {
                const osc = c.createOscillator();
                const gain = c.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(60, c.currentTime);
                osc.frequency.linearRampToValueAtTime(40, c.currentTime + 1.5);
                gain.gain.setValueAtTime(0.2, c.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.5);
                osc.connect(gain);
                gain.connect(sfxBus);
                osc.start();
                osc.stop(c.currentTime + 1.5);
                noise(1, 0.1);
            } catch (_) { /* silent */ }
        },

        // صوت ألعاب نارية
        firework() {
            noise(0.3, 0.15);
            setTimeout(() => {
                playTone(1200 + Math.random() * 800, 0.2, 'sine', 0.1);
                playTone(800 + Math.random() * 600, 0.3, 'sine', 0.08);
            }, 100);
        }
    };

    return api;
})();

window.SFX = SFX;
