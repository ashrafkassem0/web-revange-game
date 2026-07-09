// ============================================================
//  QURAN AYAHS — تلاوة عشوائية عند راحة الموقد (بدون تكرار حتى انتهاء القائمة)
// ============================================================

const QuranAyahs = (function () {
    const STORAGE_KEY = 'revenge_quran_ayah_deck';

    let _ayahs = null;
    let _byId = null;
    let _audio = null;
    let _unlocked = false;

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
        return a;
    }

    function readDeck() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || !Array.isArray(data.remaining)) return null;
            return data;
        } catch (_) {
            return null;
        }
    }

    function writeDeck(remaining) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ remaining: remaining }));
        } catch (_) { /* ignore */ }
    }

    function allIds() {
        return (_ayahs || []).map((a) => a.id);
    }

    function ensureDeck() {
        const ids = allIds();
        if (!ids.length) return [];

        const deck = readDeck();
        const idSet = Object.create(null);
        for (let i = 0; i < ids.length; i++) idSet[ids[i]] = true;

        let remaining = deck && Array.isArray(deck.remaining)
            ? deck.remaining.filter((id) => idSet[id])
            : [];

        if (!remaining.length) {
            remaining = shuffle(ids);
            writeDeck(remaining);
        }
        return remaining;
    }

    function nextAyah() {
        if (!_ayahs || !_ayahs.length) return null;
        const remaining = ensureDeck();
        if (!remaining.length) return null;

        const idx = Math.floor(Math.random() * remaining.length);
        const id = remaining.splice(idx, 1)[0];
        writeDeck(remaining);

        return _byId[id] || null;
    }

    function getAudio() {
        if (!_audio) {
            _audio = new Audio();
            _audio.preload = 'auto';
            _audio.crossOrigin = 'anonymous';
            _audio.addEventListener('error', () => {
                try {
                    if (typeof notify === 'function') {
                        notify('تعذّر تشغيل التلاوة (تحقق من الاتصال)', '#e74c3c');
                    }
                } catch (_) { /* ignore */ }
            });
        }
        return _audio;
    }

    /** يُستدعى داخل تفاعل المستخدم لفتح قفل التشغيل التلقائي */
    function unlock() {
        if (_unlocked) return;
        _unlocked = true;
        try {
            const a = getAudio();
            a.muted = true;
            a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
            const p = a.play();
            if (p && typeof p.then === 'function') {
                p.then(() => {
                    a.pause();
                    a.muted = false;
                    a.removeAttribute('src');
                    try { a.load(); } catch (_) { /* ignore */ }
                }).catch(() => {
                    a.muted = false;
                });
            } else {
                a.muted = false;
            }
        } catch (_) {
            _unlocked = false;
        }
    }

    function applyVolume(audio) {
        const target = audio || _audio;
        if (!target) return;
        let vol = 0.9;
        try {
            if (typeof SFX !== 'undefined') {
                if (SFX.isMuted && SFX.isMuted()) {
                    target.volume = 0;
                    return;
                }
                const master = SFX.getMasterVolume ? SFX.getMasterVolume() : 1;
                const quran = SFX.getQuranVolume ? SFX.getQuranVolume() : 0.9;
                vol = Math.max(0, Math.min(1, master * quran));
            }
        } catch (_) { /* ignore */ }
        target.volume = vol;
    }

    function stop() {
        if (!_audio) return;
        try {
            _audio.pause();
            _audio.currentTime = 0;
        } catch (_) { /* ignore */ }
    }

    function playAyah(ayah) {
        if (!ayah || !ayah.url) return false;
        const audio = getAudio();
        try { audio.pause(); } catch (_) { /* ignore */ }

        applyVolume(audio);
        audio.muted = false;
        audio.src = ayah.url;

        const p = audio.play();
        if (p && typeof p.catch === 'function') {
            p.catch((err) => {
                console.warn('[QuranAyahs] play failed:', err && err.message ? err.message : err);
                try {
                    if (typeof notify === 'function') {
                        notify('تعذّر تشغيل التلاوة', '#e74c3c');
                    }
                } catch (_) { /* ignore */ }
            });
        }
        return true;
    }

    function indexAyahs(list) {
        _ayahs = Array.isArray(list) ? list : [];
        _byId = Object.create(null);
        for (let i = 0; i < _ayahs.length; i++) {
            const a = _ayahs[i];
            if (a && a.id) _byId[a.id] = a;
        }
    }

    /** تحميل فوري من البيانات المضمّنة (بدون fetch — يعمل مع file://) */
    function load() {
        if (_ayahs !== null) return Promise.resolve(_ayahs);

        const data = (typeof window !== 'undefined') ? window.QURAN_AYAHS_DATA : null;
        const list = data && Array.isArray(data.ayahs) ? data.ayahs : [];
        if (!list.length) {
            console.warn('[QuranAyahs] QURAN_AYAHS_DATA missing — تأكد من تحميل quran-ayahs-data.js');
        }
        indexAyahs(list);
        return Promise.resolve(_ayahs);
    }

    function isReady() {
        return !!(_ayahs && _ayahs.length);
    }

    /**
     * تشغيل متزامن داخل مسار نقرة المستخدم.
     * يعيد كائن الآية أو null.
     */
    function playRandom() {
        unlock();
        if (!isReady()) load();
        if (!isReady()) {
            if (typeof notify === 'function') {
                notify('قائمة التلاوات غير جاهزة', '#e74c3c');
            }
            return null;
        }

        const ayah = nextAyah();
        if (!ayah) return null;
        playAyah(ayah);
        return ayah;
    }

    // حمّل فوراً إن كانت البيانات متاحة
    load();

    return {
        load,
        playRandom,
        stop,
        applyVolume,
        isReady,
        unlock
    };
})();

if (typeof window !== 'undefined') {
    window.QuranAyahs = QuranAyahs;
}
