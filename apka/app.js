document.addEventListener('DOMContentLoaded', () => {

    // --- POMOCNÉ CBT FUNKCE (původně úplně chyběly) ---
    function buildCbtReflection() {
        return {
            summary: '',
            facts: '',
            assumptions: '',
            alternative: ''
        };
    }

    function buildSimpleCbtReflection(emotion, trigger, autoT, evid, balT, action) {
        return {
            emotion: emotion,
            trigger: trigger,
            autoThought: autoT,
            evidence: evid,
            alternative: balT,
            action: action
        };
    }

    // --- INICIALIZACE TABŮ (původně utržený začátek) ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const quickCbtBtn = document.getElementById('quickCbtBtn');
    const btnOpenCbtFromHome = document.getElementById('btnOpenCbtFromHome');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    document.querySelectorAll('[data-go-tab]').forEach(k => {
        k.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = k.getAttribute('data-go-tab');
            switchTab(targetTab);
        });
    });

    // Domácí rychlé akce: ať klidně fungují i přes vlastní tlačítka
    const homeQuickActions = document.querySelectorAll('.home-quick-action');
    homeQuickActions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = btn.getAttribute('data-go-tab');
            switchTab(tabId);
        });
    });


    [quickCbtBtn, btnOpenCbtFromHome].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab('journal');
            });
        }
    });

    function switchTab(tabId) {
        if (!tabId) return;

        const panelId = `panel-${tabId}`;
        const targetPanel = document.getElementById(panelId);
        const targetButton = [...tabBtns].find(btn => btn.dataset.tab === tabId);

        if (!targetPanel || !targetButton) return;

        // Aktivní tab
        tabBtns.forEach(b => {
            const isActive = b === targetButton;
            b.classList.toggle('active', isActive);
            b.toggleAttribute('aria-current', isActive);
        });

        // Aktivní panel
        tabPanels.forEach(p => {
            if (p.id === panelId) p.classList.add('active');
            else p.classList.remove('active');
        });

        // Nechat layout „scrollovat“ jen po obsahu aplikace
        window.scrollTo({ top: 0, behavior: 'auto' });
    }

    // --- HODINY A POZDRAV ---
    function updateClock() {
        const now = new Date();
        const timeWidget = document.getElementById('timeWidget');
        const greeting = document.getElementById('headerGreeting');
        
        if (timeWidget) {
            timeWidget.textContent = now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
        }
        
        if (greeting) {
            const hour = now.getHours();
            if (hour < 9) greeting.textContent = "Dobré ráno, pomalý start...";
            else if (hour < 12) greeting.textContent = "Krásné dopoledne, najdi svůj střed...";
            else if (hour < 17) greeting.textContent = "Dobré odpoledne, nadechni se...";
            else if (hour < 21) greeting.textContent = "Klidný podvečer, čas zpomalit...";
            else greeting.textContent = "Dobrou noc, nechej myšlenky odplout...";
        }
    }
    setInterval(updateClock, 60000);
    updateClock();

    // --- LOKÁLNÍ ÚLOŽIŠTĚ (STATS) ---
    const defaultStats = { minutes: 0, sessions: 0, breaths: 0, joys: 0, streak: 0, lastVisit: '' };
    let appStats = JSON.parse(localStorage.getItem('oasis_stats')) || defaultStats;
    
    function saveStats() {
        localStorage.setItem('oasis_stats', JSON.stringify(appStats));
        renderStats();
    }
    
    function renderStats() {
        const statTotalMinutes = document.getElementById('statTotalMinutes');
        const statSessions = document.getElementById('statSessions');
        const statBreaths = document.getElementById('statBreaths');
        const statJoys = document.getElementById('statJoys');
        const totalFocusMinutes = document.getElementById('totalFocusMinutes');
        const plantsCount = document.getElementById('plantsCount');
        const gardenStreak = document.getElementById('gardenStreak');

        if (statTotalMinutes) statTotalMinutes.textContent = appStats.minutes;
        if (statSessions) statSessions.textContent = appStats.sessions;
        if (statBreaths) statBreaths.textContent = appStats.breaths;
        if (statJoys) statJoys.textContent = appStats.joys;
        
        if (totalFocusMinutes) totalFocusMinutes.textContent = appStats.minutes;
        if (plantsCount) plantsCount.textContent = appStats.sessions;
        if (gardenStreak) gardenStreak.textContent = appStats.streak;
        
        renderGarden();
    }

    function updateStreak() {
        const today = new Date().toDateString();
        if (appStats.lastVisit !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (appStats.lastVisit === yesterday.toDateString()) {
                appStats.streak += 1;
            } else if (appStats.lastVisit !== '') {
                appStats.streak = 1;
            } else {
                appStats.streak = 1;
            }
            appStats.lastVisit = today;
            saveStats();
        }
    }
    updateStreak();
    renderStats();

    // --- ZAHRADA ---
    function renderGarden() {
        const plot = document.getElementById('gardenPlot');
        if (!plot) return;
        plot.innerHTML = '';
        const plants = ['🌱', '🌿', '🪴', '🌸', '🌲', '🌾', '🍄'];
        const plantCount = Math.min(appStats.sessions, 20); // Limit na 20 rostlin
        
        if (plantCount === 0) {
            plot.innerHTML = '<span style="color:var(--text-muted); font-size: 0.9rem;">Tvá zahrada zatím spí. Spusť časovač soustředění a vypěstuj první rostlinu.</span>';
            return;
        }
        
        for (let i = 0; i < plantCount; i++) {
            const plant = document.createElement('div');
            plant.className = 'garden-plant';
            plant.textContent = plants[i % plants.length];
            plant.style.animationDelay = `${i * 0.1}s`;
            plot.appendChild(plant);
        }
    }

    // --- ZVUKY (WEB AUDIO API) ---
    let audioCtx = null;
    let isPlayingSound = false;
    let masterGain = null;
    let soundOscillators = [];
    
    const soundToggleBtn = document.getElementById('soundToggle');
    const soundSelect = document.getElementById('soundSelect');
    const soundIcon = document.getElementById('soundIcon');

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.connect(audioCtx.destination);
            masterGain.gain.value = 0;
        }
    }

    function startSound(type) {
        initAudio();
        stopSound(false);
        
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 2); // Fade in

        if (type === 'drone') {
            createOscillator(130.81, 'sine'); // C3
            createOscillator(196.00, 'sine'); // G3
            createOscillator(131.5, 'sine');  
        } else if (type === 'binaural') {
            createOscillator(200, 'sine', -1); // Levé ucho
            createOscillator(206, 'sine', 1);  // Pravé ucho (6Hz Theta vlny)
        } else if (type === 'rain') {
            createNoise();
        }
    }

    function createOscillator(freq, type, pan = 0) {
        const osc = audioCtx.createOscillator();
        const panner = audioCtx.createStereoPanner();
        panner.pan.value = pan;
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(panner);
        panner.connect(masterGain);
        osc.start();
        soundOscillators.push(osc);
    }

    function createNoise() {
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        noise.connect(filter);
        filter.connect(masterGain);
        noise.start();
        soundOscillators.push(noise);
    }

    function stopSound(fadeOut = true) {
        if (masterGain && fadeOut) {
            masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
            masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
            setTimeout(() => killOscillators(), 1000);
        } else {
            killOscillators();
        }
    }

    function killOscillators() {
        soundOscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        soundOscillators = [];
    }

    if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', () => {
            isPlayingSound = !isPlayingSound;
            if (isPlayingSound) {
                startSound(soundSelect ? soundSelect.value : 'drone');
                if (soundIcon) soundIcon.setAttribute('data-lucide', 'volume-2');
                soundToggleBtn.setAttribute('aria-pressed', 'true');
                if (soundToggleBtn.querySelector('svg')) {
                    soundToggleBtn.querySelector('svg').style.color = 'var(--text-primary)';
                    soundToggleBtn.querySelector('svg').style.filter = 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.65))';
                }

                soundToggleBtn.classList.add('active');

            } else {
                stopSound();
                if (soundIcon) soundIcon.setAttribute('data-lucide', 'volume-x');
                soundToggleBtn.setAttribute('aria-pressed', 'false');
                if (soundToggleBtn.querySelector('svg')) {
                    soundToggleBtn.querySelector('svg').style.color = 'var(--text-secondary)';
                    soundToggleBtn.querySelector('svg').style.filter = 'none';
                }

                soundToggleBtn.classList.remove('active');
            }
            if (window.lucide) window.lucide.createIcons();
        });
    }

    if (soundSelect) {
        soundSelect.addEventListener('change', () => {
            if (isPlayingSound) startSound(soundSelect.value);
        });
    }

    // --- NOTIFIKACE ---
    const notificationStatus = document.getElementById('notificationStatus');
    if (notificationStatus) {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                notificationStatus.textContent = '🔔 Připojeno';
                notificationStatus.classList.add('granted');
            } else {
                notificationStatus.addEventListener('click', () => {
                    Notification.requestPermission().then(perm => {
                        if (perm === 'granted') {
                            notificationStatus.textContent = '🔔 Připojeno';
                            notificationStatus.classList.add('granted');
                        }
                    });
                });
            }
        } else {
            notificationStatus.style.display = 'none';
        }
    }

    // --- DECHOVÉ CVIČENÍ ---
    const btnStartBreath = document.getElementById('btnStartBreath');
    const breathAction = document.getElementById('breathAction');
    const breathTimer = document.getElementById('breathTimer');
    const breathCircle = document.getElementById('breathCircle');
    let breathingInterval;
    let isBreathing = false;
    
    const phases = [
        { text: 'Nádech', duration: 4, scale: 1.5 },
        { text: 'Zadrž dech', duration: 4, scale: 1.5 },
        { text: 'Výdech', duration: 4, scale: 1 },
        { text: 'Zadrž dech', duration: 4, scale: 1 }
    ];

    if (btnStartBreath) {
        btnStartBreath.addEventListener('click', () => {
            if (isBreathing) {
                stopBreathing();
            } else {
                startBreathing();
            }
        });
    }

    function startBreathing() {
        isBreathing = true;
        if (btnStartBreath) {
            btnStartBreath.textContent = 'Ukončit cvičení';
            btnStartBreath.classList.replace('btn-primary', 'btn-secondary');
        }
        appStats.breaths += 1;
        saveStats();
        
        let phaseIdx = 0;
        let phaseTime = phases[phaseIdx].duration;
        if (breathAction) breathAction.textContent = phases[phaseIdx].text;
        if (breathCircle) breathCircle.style.transform = `scale(${phases[phaseIdx].scale})`;
        
        breathingInterval = setInterval(() => {
            phaseTime--;
            if (phaseTime <= 0) {
                phaseIdx = (phaseIdx + 1) % phases.length;
                phaseTime = phases[phaseIdx].duration;
                if (breathAction) breathAction.textContent = phases[phaseIdx].text;
                if (breathCircle) breathCircle.style.transform = `scale(${phases[phaseIdx].scale})`;
            }
            if (breathTimer) breathTimer.textContent = phaseTime;
        }, 1000);
    }

    function stopBreathing() {
        clearInterval(breathingInterval);
        isBreathing = false;
        if (btnStartBreath) {
            btnStartBreath.textContent = 'Spustit cvičení';
            btnStartBreath.classList.replace('btn-secondary', 'btn-primary');
        }
        if (breathAction) breathAction.textContent = 'Připrav se';
        if (breathTimer) breathTimer.textContent = '--';
        if (breathCircle) breathCircle.style.transform = 'scale(1)';
    }

    // --- ČASOVAČ SOUSTŘEDĚNÍ (FOCUS TIMER) ---
    let focusTimeLeft = 300; 
    let totalFocusDuration = 300;
    let focusInterval;
    let isFocusRunning = false;
    
    const presetBtns = document.querySelectorAll('.btn-preset');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerProgress = document.getElementById('timerProgress');
    const btnStartFocus = document.getElementById('btnStartFocus');
    const btnZenMode = document.getElementById('btnZenMode');
    const zenOverlay = document.getElementById('zenOverlay');
    const btnExitZen = document.getElementById('btnExitZen');
    const btnPauseZen = document.getElementById('btnPauseZen');
    const zenTimerDisplay = document.getElementById('zenTimerDisplay');
    const focusTask = document.getElementById('focusTask');
    const zenTaskTitle = document.getElementById('zenTaskTitle');
    
    const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 45; // r=45
    if (timerProgress) {
        timerProgress.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;
    }

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isFocusRunning) return;
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            totalFocusDuration = parseInt(btn.getAttribute('data-time')) * 60;
            focusTimeLeft = totalFocusDuration;
            updateTimerUI();
        });
    });

    function updateTimerUI() {
        const m = Math.floor(focusTimeLeft / 60).toString().padStart(2, '0');
        const s = (focusTimeLeft % 60).toString().padStart(2, '0');
        const timeStr = `${m}:${s}`;
        
        if (timerDisplay) timerDisplay.textContent = timeStr;
        if (zenTimerDisplay) zenTimerDisplay.textContent = timeStr;
        
        if (timerProgress) {
            const fraction = focusTimeLeft / totalFocusDuration;
            timerProgress.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - fraction);
        }
    }

    function startFocusTimer() {
        if (isFocusRunning) return;
        isFocusRunning = true;
        if (btnStartFocus) {
            btnStartFocus.innerHTML = '<i data-lucide="pause"></i> Pozastavit';
        }
        if (btnPauseZen) btnPauseZen.textContent = 'Pozastavit';
        if (window.lucide) window.lucide.createIcons();
        
        if (zenTaskTitle && focusTask) {
            zenTaskTitle.textContent = focusTask.value.trim() || 'Soustředěná práce';
        }
        
        focusInterval = setInterval(() => {
            focusTimeLeft--;
            updateTimerUI();
            
            if (focusTimeLeft <= 0) {
                completeFocusTimer();
            }
        }, 1000);
    }

    function pauseFocusTimer() {
        isFocusRunning = false;
        clearInterval(focusInterval);
        if (btnStartFocus) {
            btnStartFocus.innerHTML = '<i data-lucide="play"></i> Pokračovat';
        }
        if (btnPauseZen) btnPauseZen.textContent = 'Pokračovat';
        if (window.lucide) window.lucide.createIcons();
    }

    function completeFocusTimer() {
        pauseFocusTimer();
        focusTimeLeft = totalFocusDuration;
        updateTimerUI();
        
        appStats.sessions += 1;
        appStats.minutes += Math.round(totalFocusDuration / 60);
        saveStats();
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Oáza', { body: 'Tvoje soustředění skončilo. Skvělá práce!', icon: 'icon.svg' });
        } else {
            alert("Čas vypršel. Skvělá práce!");
        }
        
        exitZenMode();
        if (btnStartFocus) {
            btnStartFocus.innerHTML = '<i data-lucide="play"></i> Spustit soustředění';
        }
        if (window.lucide) window.lucide.createIcons();
    }

    if (btnStartFocus) {
        btnStartFocus.addEventListener('click', () => {
            isFocusRunning ? pauseFocusTimer() : startFocusTimer();
        });
    }
    
    if (btnPauseZen) {
        btnPauseZen.addEventListener('click', () => {
            isFocusRunning ? pauseFocusTimer() : startFocusTimer();
        });
    }

    if (btnZenMode) {
        btnZenMode.addEventListener('click', () => {
            if (zenOverlay) zenOverlay.classList.add('active');
            if (!isFocusRunning) startFocusTimer();
            document.documentElement.requestFullscreen().catch(err => console.log(err));
        });
    }

    function exitZenMode() {
        if (zenOverlay) zenOverlay.classList.remove('active');
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.log(err));
        }
    }
    if (btnExitZen) {
        btnExitZen.addEventListener('click', exitZenMode);
    }

    // --- SEBEUKOTVENÍ (GROUNDING 5-4-3-2-1) ---
    const groundingData = [
        { count: 5, action: "vidíš kolem sebe", icon: "eye" },
        { count: 4, action: "se můžeš dotknout", icon: "hand" },
        { count: 3, action: "slyšíš", icon: "ear" },
        { count: 2, action: "cítíš (vůně)", icon: "wind" },
        { count: 1, action: "můžeš ochutnat (nebo o čem víš, že má chuť)", icon: "coffee" }
    ];
    let currentGroundingStep = 0;
    let currentGroundingInputs = 0;

    const btnStartGrounding = document.getElementById('btnStartGrounding');
    const btnNextGrounding = document.getElementById('btnNextGrounding');
    const btnRestartGrounding = document.getElementById('btnRestartGrounding');
    const btnAddToGrounding = document.getElementById('btnAddToGrounding');
    const groundingInput = document.getElementById('groundingInput');
    const groundingSlots = document.getElementById('groundingSlots');
    const groundingPrompt = document.getElementById('groundingPrompt');
    const groundingStepBadge = document.getElementById('groundingStepBadge');
    
    function showGroundingView(viewId) {
        ['groundingIntro', 'groundingStep', 'groundingSuccess'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        const activeView = document.getElementById(viewId);
        if (activeView) activeView.classList.add('active');
    }

    function renderGroundingStep() {
        const step = groundingData[currentGroundingStep];
        if (groundingStepBadge) groundingStepBadge.textContent = `Krok ${currentGroundingStep + 1} / 5`;
        if (groundingPrompt) {
            groundingPrompt.innerHTML = `<i data-lucide="${step.icon}"></i> Napiš ${step.count} věc${step.count > 4 ? 'í' : (step.count > 1 ? 'i' : 'u')}, které ${step.action}`;
        }
        if (window.lucide) window.lucide.createIcons();
        
        currentGroundingInputs = 0;
        if (btnNextGrounding) btnNextGrounding.disabled = true;
        if (groundingInput) {
            groundingInput.value = '';
            groundingInput.focus();
        }
        
        if (groundingSlots) {
            groundingSlots.innerHTML = '';
            for (let i = 0; i < step.count; i++) {
                const slot = document.createElement('div');
                slot.className = 'grounding-slot empty';
                slot.id = `slot-${currentGroundingStep}-${i}`;
                slot.textContent = '?';
                groundingSlots.appendChild(slot);
            }
        }
    }

    if (btnStartGrounding) {
        btnStartGrounding.addEventListener('click', () => {
            currentGroundingStep = 0;
            showGroundingView('groundingStep');
            renderGroundingStep();
        });
    }

    function addGroundingItem() {
        if (!groundingInput) return;
        const val = groundingInput.value.trim();
        if (!val) return;
        
        const step = groundingData[currentGroundingStep];
        if (currentGroundingInputs < step.count) {
            const slot = document.getElementById(`slot-${currentGroundingStep}-${currentGroundingInputs}`);
            if (slot) {
                slot.className = 'grounding-slot filled';
                slot.textContent = val;
            }
            currentGroundingInputs++;
            groundingInput.value = '';
            
            if (currentGroundingInputs >= step.count) {
                if (btnNextGrounding) {
                    btnNextGrounding.disabled = false;
                    btnNextGrounding.focus();
                }
            } else {
                groundingInput.focus();
            }
        }
    }

    if (btnAddToGrounding) btnAddToGrounding.addEventListener('click', addGroundingItem);
    if (groundingInput) {
        groundingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addGroundingItem();
        });
    }

    if (btnNextGrounding) {
        btnNextGrounding.addEventListener('click', () => {
            currentGroundingStep++;
            if (currentGroundingStep < groundingData.length) {
                renderGroundingStep();
            } else {
                showGroundingView('groundingSuccess');
            }
        });
    }

    if (btnRestartGrounding) {
        btnRestartGrounding.addEventListener('click', () => {
            showGroundingView('groundingIntro');
        });
    }

    // --- PAMĚŤOVÁ HRA (MEMORY GAME) ---
    const memoryBank = ['Strom', 'Kámen', 'Řeka', 'Mrak', 'Tráva', 'Slunce', 'Měsíc', 'Hvězda', 'Vítr', 'Písek', 'List', 'Hora', 'Mech', 'Kapka', 'Země', 'Les', 'Pták', 'Květ'];
    let memoryCurrentWords = [];
    
    function showMemoryView(viewId) {
        ['memoryIntro', 'memoryDisplay', 'memoryInputView', 'memoryResult'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        const activeView = document.getElementById(viewId);
        if (activeView) activeView.classList.add('active');
    }

    const btnStartMemory = document.getElementById('btnStartMemory');
    if (btnStartMemory) {
        btnStartMemory.addEventListener('click', () => {
            let shuffled = [...memoryBank].sort(() => 0.5 - Math.random());
            memoryCurrentWords = shuffled.slice(0, 5);
            
            const wordsGrid = document.getElementById('wordsGrid');
            if (wordsGrid) {
                wordsGrid.innerHTML = '';
                memoryCurrentWords.forEach(word => {
                    const d = document.createElement('div');
                    d.className = 'memory-word-card';
                    d.textContent = word;
                    wordsGrid.appendChild(d);
                });
            }
            
            showMemoryView('memoryDisplay');
            
            const progressBar = document.getElementById('memoryProgressBar');
            if (progressBar) {
                progressBar.style.transition = 'none';
                progressBar.style.width = '100%';
                
                setTimeout(() => {
                    progressBar.style.transition = 'width 10s linear';
                    progressBar.style.width = '0%';
                }, 50);
            }
            
            setTimeout(() => {
                showMemoryView('memoryInputView');
                const memInput = document.getElementById('memoryInput');
                if (memInput) {
                    memInput.value = '';
                    memInput.focus();
                }
            }, 10000);
        });
    }

    const btnSubmitMemory = document.getElementById('btnSubmitMemory');
    if (btnSubmitMemory) {
        btnSubmitMemory.addEventListener('click', () => {
            const memInput = document.getElementById('memoryInput');
            if (!memInput) return;
            const inputVal = memInput.value.toLowerCase();
            const wordsEntered = inputVal.split(/[\s,]+/).filter(w => w.length > 0);
            
            const correct = [];
            const missing = [];
            
            memoryCurrentWords.forEach(w => {
                const lw = w.toLowerCase();
                if (wordsEntered.some(entered => lw.includes(entered) || entered.includes(lw))) {
                    correct.push(w);
                } else {
                    missing.push(w);
                }
            });
            
            const memoryScore = document.getElementById('memoryScore');
            const memoryFeedback = document.getElementById('memoryFeedback');
            if (memoryScore) memoryScore.textContent = `${correct.length} / 5`;
            if (memoryFeedback) {
                memoryFeedback.textContent = correct.length === 5 ? 'Perfektní! Skvělé soustředění.' : (correct.length > 2 ? 'Dobrá práce. Mysl se zklidňuje.' : 'Nevadí. Zkusíme to znovu pro lepší focus.');
            }
            
            const ulCor = document.getElementById('memoryCorrectList');
            if (ulCor) {
                ulCor.innerHTML = correct.map(w => `<li><i data-lucide="check" style="color:var(--success)"></i> ${w}</li>`).join('');
            }
            
            const ulMis = document.getElementById('memoryMissingList');
            if (ulMis) {
                ulMis.innerHTML = missing.map(w => `<li><i data-lucide="x" style="color:var(--danger)"></i> ${w}</li>`).join('');
            }
            
            if (window.lucide) window.lucide.createIcons();
            showMemoryView('memoryResult');
        });
    }

    const btnRestartMemory = document.getElementById('btnRestartMemory');
    if (btnRestartMemory) {
        btnRestartMemory.addEventListener('click', () => {
            showMemoryView('memoryIntro');
        });
    }

    // --- TRIAGE MYŠLENEK ---
    let triageToday = JSON.parse(localStorage.getItem('oasis_triage_today')) || [];
    let triageLater = JSON.parse(localStorage.getItem('oasis_triage_later')) || [];
    
    function saveTriage() {
        localStorage.setItem('oasis_triage_today', JSON.stringify(triageToday));
        localStorage.setItem('oasis_triage_later', JSON.stringify(triageLater));
        renderTriage();
    }

    function renderTriage() {
        const countToday = document.getElementById('countToday');
        const countLater = document.getElementById('countLater');
        if (countToday) countToday.textContent = triageToday.length;
        if (countLater) countLater.textContent = triageLater.length;
        
        const renderList = (arr, listId, arrName) => {
            const ul = document.getElementById(listId);
            if (!ul) return;
            ul.innerHTML = arr.length === 0 ? '<li class="empty-list">Prázdné</li>' : '';
            arr.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item}</span><button class="btn-icon delete-btn" data-arr="${arrName}" data-idx="${index}"><i data-lucide="trash-2"></i></button>`;
                ul.appendChild(li);
            });
        };
        
        renderList(triageToday, 'listToday', 'today');
        renderList(triageLater, 'listLater', 'later');
        if (window.lucide) window.lucide.createIcons();
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnEl = e.currentTarget;
                const arrName = btnEl.getAttribute('data-arr');
                const idx = parseInt(btnEl.getAttribute('data-idx'));
                if (arrName === 'today') triageToday.splice(idx, 1);
                else triageLater.splice(idx, 1);
                saveTriage();
            });
        });
    }
    renderTriage();

    const thoughtInput = document.getElementById('thoughtInput');
    const btnCatToday = document.getElementById('btnCatToday');
    const btnCatLater = document.getElementById('btnCatLater');
    const btnCatBurn = document.getElementById('btnCatBurn');

    if (btnCatToday && thoughtInput) {
        btnCatToday.addEventListener('click', () => {
            const val = thoughtInput.value.trim();
            if (val) { triageToday.push(val); thoughtInput.value = ''; saveTriage(); }
        });
    }
    if (btnCatLater && thoughtInput) {
        btnCatLater.addEventListener('click', () => {
            const val = thoughtInput.value.trim();
            if (val) { triageLater.push(val); thoughtInput.value = ''; saveTriage(); }
        });
    }
    if (btnCatBurn && thoughtInput) {
        btnCatBurn.addEventListener('click', () => {
            const val = thoughtInput.value.trim();
            if (!val) return;
            
            const overlay = document.getElementById('burningOverlay');
            const burningText = document.getElementById('burningText');
            if (burningText) burningText.textContent = val;
            thoughtInput.value = '';
            
            if (overlay) overlay.classList.add('active');
            
            const particles = document.getElementById('fireParticles');
            if (particles) {
                particles.innerHTML = '';
                for (let i = 0; i < 30; i++) {
                    const p = document.createElement('div');
                    p.className = 'fire-particle';
                    p.style.left = `${Math.random() * 100}%`;
                    p.style.animationDelay = `${Math.random() * 2}s`;
                    particles.appendChild(p);
                }
            }
            
            setTimeout(() => {
                if (overlay) overlay.classList.remove('active');
            }, 4000);
        });
    }

    // --- DENÍK & CBT REFLEXE ---
    let journalEntries = JSON.parse(localStorage.getItem('oasis_journal')) || [];
    
    function saveJournalEntries() {
        localStorage.setItem('oasis_journal', JSON.stringify(journalEntries));
        renderCbtHistory();
    }

    function renderCbtHistory() {
        const historyDiv = document.getElementById('cbtHistoryList');
        const searchDiv = document.getElementById('journalSearchResults');
        
        const html = journalEntries.slice(0, 5).map(entry => `
            <div class="journal-card-mini">
                <div class="date">${new Date(entry.date).toLocaleString('cs-CZ')}</div>
                <div class="content">${entry.type === 'cbt' ? `<strong>Reflexe:</strong> ${entry.content.alternative}` : entry.content}</div>
            </div>
        `).join('');
        
        if (historyDiv) historyDiv.innerHTML = html || '<p>Zatím žádné záznamy.</p>';
        if (searchDiv) searchDiv.innerHTML = html; 
    }
    renderCbtHistory();

    const btnCreateCbt = document.getElementById('btnCreateCbt');
    if (btnCreateCbt) {
        btnCreateCbt.addEventListener('click', () => {
            const res = buildCbtReflection();
            const cbtEmotion = document.getElementById('cbtEmotion');
            const cbtEvidence = document.getElementById('cbtEvidence');
            const cbtAssumption = document.getElementById('cbtAssumption');
            const cbtInsight = document.getElementById('cbtInsight');

            res.summary = `Přerámování emoce: ${cbtEmotion ? cbtEmotion.value : ''}`;
            res.facts = cbtEvidence ? cbtEvidence.value : '';
            res.assumptions = cbtAssumption ? cbtAssumption.value : '';
            res.alternative = cbtInsight ? cbtInsight.value : '';
            
            if (!res.alternative) return;
            
            const cbtResult = document.getElementById('cbtResult');
            if (cbtResult) {
                cbtResult.innerHTML = `
                    <h4>Výsledek:</h4>
                    <p><strong>Nová myšlenka:</strong> ${res.alternative}</p>
                    <p><em>Uloženo do deníku.</em></p>
                `;
            }
            
            journalEntries.unshift({ date: new Date().toISOString(), type: 'cbt', content: res });
            saveJournalEntries();
            
            ['cbtEmotion', 'cbtThought', 'cbtEvidence', 'cbtAssumption', 'cbtInsight'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        });
    }

    const btnCreateSimpleCbt = document.getElementById('btnCreateSimpleCbt');
    if (btnCreateSimpleCbt) {
        btnCreateSimpleCbt.addEventListener('click', () => {
            const emotion = 'Vlastní záznam';
            const trigger = document.getElementById('cbtStepTrigger') ? document.getElementById('cbtStepTrigger').value : '';
            const autoT = document.getElementById('cbtStepThought') ? document.getElementById('cbtStepThought').value : '';
            const evid = document.getElementById('cbtStepEvidence') ? document.getElementById('cbtStepEvidence').value : '';
            const balT = document.getElementById('cbtStepBalanced') ? document.getElementById('cbtStepBalanced').value : '';
            const action = document.getElementById('cbtStepAction') ? document.getElementById('cbtStepAction').value : '';
            
            if (!balT) return;
            
            const res = buildSimpleCbtReflection(emotion, trigger, autoT, evid, balT, action);
            const simpleCbtResult = document.getElementById('simpleCbtResult');
            if (simpleCbtResult) {
                simpleCbtResult.innerHTML = `
                    <h4>Plán akce:</h4>
                    <p><strong>Vyvážený pohled:</strong> ${balT}</p>
                    <p><strong>Akce:</strong> ${action}</p>
                    <p><em>Uloženo do deníku.</em></p>
                `;
            }
            
            journalEntries.unshift({ date: new Date().toISOString(), type: 'cbt', content: res });
            saveJournalEntries();
            
            ['cbtStepTrigger', 'cbtStepThought', 'cbtStepEvidence', 'cbtStepBalanced', 'cbtStepAction'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        });
    }

    const btnSaveJournal = document.getElementById('btnSaveJournal');
    if (btnSaveJournal) {
        btnSaveJournal.addEventListener('click', () => {
            const journalEntry = document.getElementById('journalEntry');
            if (!journalEntry) return;
            const val = journalEntry.value.trim();
            if (val) {
                journalEntries.unshift({ date: new Date().toISOString(), type: 'text', content: val });
                saveJournalEntries();
                journalEntry.value = '';
            }
        });
    }

    const btnSearchJournal = document.getElementById('btnSearchJournal');
    if (btnSearchJournal) {
        btnSearchJournal.addEventListener('click', () => {
            const journalSearch = document.getElementById('journalSearch');
            if (!journalSearch) return;
            const query = journalSearch.value.toLowerCase();
            const results = journalEntries.filter(entry => {
                const text = entry.type === 'cbt' ? JSON.stringify(entry.content).toLowerCase() : entry.content.toLowerCase();
                return text.includes(query);
            });
            
            const searchDiv = document.getElementById('journalSearchResults');
            if (searchDiv) {
                searchDiv.innerHTML = results.map(entry => `
                    <div class="journal-card-mini">
                        <div class="date">${new Date(entry.date).toLocaleString('cs-CZ')}</div>
                        <div class="content">${entry.type === 'cbt' ? `<strong>Reflexe:</strong> ${entry.content.alternative}` : entry.content}</div>
                    </div>
                `).join('') || '<p>Žádné výsledky nenalezeny.</p>';
            }
        });
    }

    // --- GRATITUDE (Vděčnost) ---
    let gratitudes = JSON.parse(localStorage.getItem('oasis_gratitude')) || [];
    
    function saveGratitudes() {
        localStorage.setItem('oasis_gratitude', JSON.stringify(gratitudes));
        renderGratitudes();
    }
    
    function renderGratitudes() {
        const list = document.getElementById('gratitudeHistoryList');
        if (!list) return;
        if (gratitudes.length === 0) {
            list.innerHTML = '<p class="empty-history-text">Zatím nemáš žádné uložené radosti. Začni dneškem!</p>';
            return;
        }
        
        list.innerHTML = gratitudes.slice(0, 10).map(gGroup => `
            <div class="gratitude-group">
                <div class="date"><i data-lucide="calendar"></i> ${new Date(gGroup.date).toLocaleDateString('cs-CZ')}</div>
                <ul>
                    <li>${gGroup.items[0]}</li>
                    <li>${gGroup.items[1]}</li>
                    <li>${gGroup.items[2]}</li>
                </ul>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    }
    renderGratitudes();

    const gratitudeForm = document.getElementById('gratitudeForm');
    if (gratitudeForm) {
        gratitudeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const g1 = document.getElementById('gratitude1');
            const g2 = document.getElementById('gratitude2');
            const g3 = document.getElementById('gratitude3');

            if (!g1 || !g2 || !g3) return;

            const items = [
                g1.value.trim(),
                g2.value.trim(),
                g3.value.trim()
            ];
            
            if (items.every(i => i.length > 0)) {
                gratitudes.unshift({ date: new Date().toISOString(), items });
                appStats.joys += 3;
                saveStats();
                saveGratitudes();
                
                g1.value = '';
                g2.value = '';
                g3.value = '';
            }
        });
    }

    // --- CITÁTY ---
    const quotes = [
        { q: "Základem každého úspěchu je soustředit se na jednu věc po dostatečně dlouhou dobu.", a: "Neznámý autor" },
        { q: "Téměř vše bude fungovat znovu, pokud to na pár minut vypnete. Včetně vás.", a: "Anne Lamott" },
        { q: "Nic nezklidňuje mysl tak jako pevný záměr.", a: "Mary Shelley" },
        { q: "Tvoje pozornost je tvá nejcennější komodita.", a: "Neznámý autor" },
        { q: "Klid není nepřítomnost chaosu, ale schopnost s ním tančit.", a: "T.F. Hodge" }
    ];
    
    const dailyQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const quoteDisplay = document.getElementById('quoteDisplay');
    const quoteAuthor = document.getElementById('quoteAuthor');
    if (quoteDisplay) quoteDisplay.textContent = `"${dailyQuote.q}"`;
    if (quoteAuthor) quoteAuthor.textContent = `- ${dailyQuote.a}`;

});
