const SFX = (() => {
    let ctx = null;

    function getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function playTone(freq, duration, type = 'sine', volume = 0.3, fadeOut = true) {
        const c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, c.currentTime);
        gain.gain.setValueAtTime(volume, c.currentTime);
        if (fadeOut) {
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        }
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + duration);
    }

    function noise(duration, volume = 0.1) {
        const c = getCtx();
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
        gain.connect(c.destination);
        source.start();
    }

    return {
        // صوت إطلاق السهم
        arrow() {
            playTone(800, 0.15, 'sine', 0.2);
            setTimeout(() => playTone(1200, 0.1, 'sine', 0.1), 50);
        },

        // صوت ضربة السيف
        sword() {
            const c = getCtx();
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, c.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.2);
            gain.gain.setValueAtTime(0.25, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start();
            osc.stop(c.currentTime + 0.2);
            noise(0.1, 0.15);
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

        // صوت البرق / الرعد
        thunder() {
            noise(1.5, 0.3);
            setTimeout(() => noise(0.8, 0.15), 200);
        },

        // صوت المطر (يعمل باستمرار)
        rainLoop: null,
        startRain() {
            if (this.rainLoop) return;
            const c = getCtx();
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
            gain.gain.value = 0.06;

            source.connect(filter);
            filter.connect(gain);
            gain.connect(c.destination);
            source.start();
            this.rainLoop = { source, gain };
        },
        stopRain() {
            if (this.rainLoop) {
                this.rainLoop.gain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 1);
                setTimeout(() => {
                    this.rainLoop.source.stop();
                    this.rainLoop = null;
                }, 1000);
            }
        },

        // صوت هجوم ملك الرعب
        bossAttack() {
            const c = getCtx();
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, c.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.4);
            gain.gain.setValueAtTime(0.3, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start();
            osc.stop(c.currentTime + 0.4);
            noise(0.3, 0.2);
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
            const c = getCtx();
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(60, c.currentTime);
            osc.frequency.linearRampToValueAtTime(40, c.currentTime + 1.5);
            gain.gain.setValueAtTime(0.2, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.5);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start();
            osc.stop(c.currentTime + 1.5);
            noise(1, 0.1);
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
})();
