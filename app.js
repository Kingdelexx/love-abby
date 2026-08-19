/* ==========================================================================
   ROMANTIC DATE GAME INTERACTION & MUSIC SYNTHESIS (ABBY LOVE)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- State Registry ---
    const state = {
        noCount: 0,
        selectedDateType: '',
        selectedDate: '',
        selectedTime: '',
        audioEnabled: false,
        soundContext: null,
        melodyInterval: null
    };

    // --- DOM Elements ---
    const screens = {
        invitation: document.getElementById('screen-invitation'),
        dateSelect: document.getElementById('screen-date-select'),
        datetimeSelect: document.getElementById('screen-datetime-select'),
        confirmation: document.getElementById('screen-confirmation')
    };

    const buttons = {
        yes: document.getElementById('btn-yes'),
        no: document.getElementById('btn-no'),
        sound: document.getElementById('btn-sound'),
        confirmDatetime: document.getElementById('btn-confirm-datetime')
    };

    const hintText = document.getElementById('playful-hint');
    const dateCards = document.querySelectorAll('.date-choice-card');
    const datePicker = document.getElementById('date-picker');
    const timePicker = document.getElementById('time-picker');
    const datetimeForm = document.getElementById('datetime-form');

    // Summary screen DOM
    const badgeText = document.getElementById('selected-badge-text');
    const badgeIcon = document.getElementById('selected-badge-icon');
    const summaryPlan = document.getElementById('summary-plan');
    const summaryDate = document.getElementById('summary-date');
    const summaryTime = document.getElementById('summary-time');

    // --- Date Picker constraints ---
    // Prevent selecting dates in the past by setting min date to today
    const today = new Date().toISOString().split('T')[0];
    datePicker.min = today;
    datePicker.value = today; // default value is today

    // Set default time to 6:00 PM (18:00)
    timePicker.value = "18:00";

    // --- Canvas Particle Decoration System ---
    const canvas = document.getElementById('canvas-decorations');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId = null;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor(x, y, isExplosion = false, type = 'heart') {
            this.x = x;
            this.y = y;
            this.isExplosion = isExplosion;
            this.type = type; // 'heart' or 'circle'
            
            if (isExplosion) {
                // Radial burst velocities
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 6 + 2;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.size = Math.random() * 12 + 8;
                this.alpha = 1;
                this.decay = Math.random() * 0.02 + 0.015;
            } else {
                // Background lazy floating hearts
                this.vx = Math.random() * 0.6 - 0.3;
                this.vy = -(Math.random() * 0.8 + 0.4);
                this.size = Math.random() * 15 + 10;
                this.alpha = Math.random() * 0.4 + 0.1;
                this.decay = 0;
            }
            
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = Math.random() * 0.02 - 0.01;
            
            // Harmonious Teal/Pink colors
            const colors = [
                'rgba(249, 168, 212, ', // accent-pink
                'rgba(252, 231, 243, ', // soft-rose
                'rgba(15, 118, 110, ',  // primary-teal
                'rgba(204, 251, 241, '  // light-teal
            ];
            this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.colorBase + '1)';

            if (this.type === 'heart') {
                // Draw heart shape path
                ctx.beginPath();
                const d = this.size;
                ctx.moveTo(0, -d / 4);
                ctx.bezierCurveTo(-d / 2, -d, -d, -d / 3, 0, d * 0.6);
                ctx.bezierCurveTo(d, -d / 3, d / 2, -d, 0, -d / 4);
                ctx.fill();
            } else {
                // Draw sparkles / circles
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;

            if (this.isExplosion) {
                this.alpha -= this.decay;
                this.vy += 0.05; // tiny gravity on explosions
            } else {
                // Reset background particles when floating offscreen
                if (this.y < -30) {
                    this.y = canvas.height + 30;
                    this.x = Math.random() * canvas.width;
                    this.alpha = Math.random() * 0.4 + 0.1;
                }
            }
        }
    }

    function spawnExplosion(x, y, count = 28) {
        for (let i = 0; i < count; i++) {
            const type = Math.random() > 0.35 ? 'heart' : 'circle';
            particles.push(new Particle(x, y, true, type));
        }
    }

    function createBackgroundParticles() {
        particles = [];
        const count = Math.min(25, Math.floor(window.innerWidth / 40));
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            particles.push(new Particle(x, y, false));
        }
    }

    function runAnimationLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            
            // remove dead explosion particles
            if (particles[i].isExplosion && particles[i].alpha <= 0) {
                particles.splice(i, 1);
            }
        }
        
        animationId = requestAnimationFrame(runAnimationLoop);
    }

    createBackgroundParticles();
    runAnimationLoop();

    // --- Web Audio API Custom Sound Synthesis ---
    function initSound() {
        if (!state.soundContext) {
            state.soundContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (state.soundContext.state === 'suspended') {
            state.soundContext.resume();
        }
    }

    function playSoundEffect(type) {
        if (!state.audioEnabled || !state.soundContext) return;
        
        const ctxAudio = state.soundContext;
        const now = ctxAudio.currentTime;

        if (type === 'plop') {
            // Cute bubbly downward "plop" for NO clicks
            const osc = ctxAudio.createOscillator();
            const gain = ctxAudio.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

            osc.connect(gain);
            gain.connect(ctxAudio.destination);

            osc.start(now);
            osc.stop(now + 0.16);

        } else if (type === 'chime') {
            // Sweet ascending chime for YES/PLEASE buttons
            const osc1 = ctxAudio.createOscillator();
            const osc2 = ctxAudio.createOscillator();
            const gainNode = ctxAudio.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';

            osc1.frequency.setValueAtTime(523.25, now); // C5
            osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25); // C6

            osc2.frequency.setValueAtTime(659.25, now + 0.05); // E5
            osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.3); // E6

            gainNode.gain.setValueAtTime(0.12, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.35);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctxAudio.destination);

            osc1.start(now);
            osc2.start(now + 0.05);
            osc1.stop(now + 0.4);
            osc2.stop(now + 0.4);

        } else if (type === 'success') {
            // Complete beautiful romantic harp arpeggio (success screen)
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
            notes.forEach((freq, index) => {
                const noteTime = now + (index * 0.08);
                const osc = ctxAudio.createOscillator();
                const gain = ctxAudio.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);
                
                gain.gain.setValueAtTime(0.08, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.005, noteTime + 0.45);

                osc.connect(gain);
                gain.connect(ctxAudio.destination);

                osc.start(noteTime);
                osc.stop(noteTime + 0.5);
            });
        }
    }

    // Schedule extremely soft background melody (pentatonic bells) when unmuted
    function startBackgroundMelody() {
        if (state.melodyInterval) clearInterval(state.melodyInterval);
        
        // C major pentatonic scale frequencies (warm ambient bells)
        const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
        
        state.melodyInterval = setInterval(() => {
            if (!state.audioEnabled || !state.soundContext) return;
            const ctxAudio = state.soundContext;
            const now = ctxAudio.currentTime;

            // Pick 1-2 random notes to play with long release
            const noteCount = Math.random() > 0.6 ? 2 : 1;
            for (let i = 0; i < noteCount; i++) {
                const randomFreq = scale[Math.floor(Math.random() * scale.length)];
                const osc = ctxAudio.createOscillator();
                const gain = ctxAudio.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(randomFreq, now + (i * 0.2));
                
                // Super low volume ambient bells
                gain.gain.setValueAtTime(0.02, now + (i * 0.2));
                gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.2) + 2.0);

                osc.connect(gain);
                gain.connect(ctxAudio.destination);

                osc.start(now + (i * 0.2));
                osc.stop(now + (i * 0.2) + 2.1);
            }
        }, 3200); // Trigger every 3.2 seconds
    }

    function stopBackgroundMelody() {
        if (state.melodyInterval) {
            clearInterval(state.melodyInterval);
            state.melodyInterval = null;
        }
    }

    // --- Sound Button Event Listener ---
    buttons.sound.addEventListener('click', () => {
        initSound();
        state.audioEnabled = !state.audioEnabled;
        
        if (state.audioEnabled) {
            buttons.sound.innerHTML = '<span class="sound-icon">🔊</span>';
            buttons.sound.classList.add('sound-active');
            playSoundEffect('chime');
            startBackgroundMelody();
        } else {
            buttons.sound.innerHTML = '<span class="sound-icon">🔈</span>';
            buttons.sound.classList.remove('sound-active');
            stopBackgroundMelody();
        }
    });

    // Initialize sound on absolute first user click somewhere on the viewport
    document.body.addEventListener('click', () => {
        if (state.soundContext && state.soundContext.state === 'suspended') {
            state.soundContext.resume();
        }
    }, { once: true });


    // --- State Transition Engine ---
    function navigateTo(targetScreenId) {
        // Find visible active screen
        const activeScreen = document.querySelector('.screen-card.active');
        if (activeScreen) {
            // Fade out
            activeScreen.style.opacity = '0';
            activeScreen.style.transform = 'translateY(-15px) scale(0.97)';
            
            setTimeout(() => {
                activeScreen.classList.remove('active');
                activeScreen.style.display = 'none';
                
                // Prepare next screen
                const nextScreen = screens[targetScreenId];
                nextScreen.style.display = 'block';
                // Trigger reflow
                nextScreen.offsetHeight;
                nextScreen.classList.add('active');
                nextScreen.style.opacity = '1';
                nextScreen.style.transform = 'translateY(0) scale(1)';
            }, 350); // Matches CSS transition duration roughly
        } else {
            // Immediate fall-back
            const nextScreen = screens[targetScreenId];
            nextScreen.style.display = 'block';
            nextScreen.classList.add('active');
            nextScreen.style.opacity = '1';
            nextScreen.style.transform = 'translateY(0)';
        }
    }

    // --- Playful NO Button Mechanics ---
    const textProgression = {
        yesTexts: [
            "YES ❤️",
            "PLEASE 🥺",
            "PLEASEEE 🥺",
            "PLEASEEEEE ❤️",
            "PLEASE, ABBY LOVE 🥺❤️"
        ],
        noTexts: [
            "NO",
            "Are you sure?",
            "Really?",
            "You're breaking my heart 😭",
            "Okay okay… I'll keep asking nicely. 🥺❤️"
        ]
    };

    buttons.no.addEventListener('click', (e) => {
        initSound();
        state.noCount++;
        playSoundEffect('plop');

        // Burst single heart where they clicked
        spawnExplosion(e.clientX || e.pageX, e.clientY || e.pageY, 8);

        const currentStep = Math.min(state.noCount, 4);

        // Update Button text
        buttons.yes.textContent = textProgression.yesTexts[currentStep];
        
        if (state.noCount < 4) {
            buttons.no.textContent = textProgression.noTexts[currentStep];
        } else {
            // Hide/Move or Shrink secondary button text
            buttons.no.textContent = "Okay okay... 🥺";
            
            // Show hint message
            hintText.textContent = textProgression.noTexts[4];
            hintText.classList.remove('hidden');
        }

        // Apply scale growth factor to YES button
        // Base size, 1 + step * 0.4. Max scale of 2.6 to prevent overflow on narrow screens
        const yesScale = Math.min(1 + state.noCount * 0.4, 2.6);
        document.documentElement.style.setProperty('--yes-scale', yesScale.toString());

        // Apply shrinking factor to NO button
        const noScale = Math.max(1 - state.noCount * 0.12, 0.55);
        document.documentElement.style.setProperty('--no-scale', noScale.toString());
    });

    // Make NO button move away slightly on hover or touch (playful)
    // Runs only after 2nd rejection to prevent frustrating users early
    function deflectNoButton(e) {
        if (state.noCount < 2) return;

        // Generate translation shift: offset limits get wider as rejection increases
        const range = 20 + (state.noCount * 12); 
        const randomX = (Math.random() - 0.5) * range;
        const randomY = (Math.random() - 0.5) * range;

        buttons.no.style.transform = `scale(var(--no-scale)) translate(${randomX}px, ${randomY}px)`;
        buttons.no.style.transition = 'transform 0.15s ease-out';
    }

    buttons.no.addEventListener('mouseenter', deflectNoButton);
    buttons.no.addEventListener('touchstart', deflectNoButton, { passive: true });

    // Reset translation when mouse exits button
    buttons.no.addEventListener('mouseleave', () => {
        buttons.no.style.transform = `scale(var(--no-scale)) translate(0px, 0px)`;
        buttons.no.style.transition = 'transform 0.3s ease';
    });


    // --- Acceptance (YES/PLEASE Click) ---
    buttons.yes.addEventListener('click', (e) => {
        initSound();
        playSoundEffect('chime');
        
        // Spectacular heart burst explosion
        spawnExplosion(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2, 45);
        
        // Navigate to date choice screen
        navigateTo('dateSelect');
    });


    // --- Date Choice Cards Selection ---
    dateCards.forEach(card => {
        card.addEventListener('click', (e) => {
            initSound();
            playSoundEffect('chime');
            
            // Remove previous selections
            dateCards.forEach(c => c.classList.remove('selected'));
            
            // Highlight selected card
            card.classList.add('selected');
            
            // Capture chosen date name
            state.selectedDateType = card.getAttribute('data-date-type');
            
            // Trigger visual splash at card click location
            const rect = card.getBoundingClientRect();
            spawnExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, 18);

            // Populates date banner/badge dynamic values
            const detailsMap = {
                'Amala Date': { icon: '🍛', text: 'Amala Date' },
                'Shopping Date': { icon: '🛍️', text: 'Shopping Date' },
                'Park Date': { icon: '🌳', text: 'Park Date' },
                'Beach Date': { icon: '🏖️', text: 'Beach Date' }
            };

            const details = detailsMap[state.selectedDateType];
            badgeIcon.textContent = details.icon;
            badgeText.textContent = details.text;
            
            // Transition directly to picker page after slight pause
            setTimeout(() => {
                navigateTo('datetimeSelect');
            }, 600);
        });
    });


    // --- Form Date and Time Confirmation ---
    datetimeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!datePicker.value || !timePicker.value) return;
        
        initSound();
        playSoundEffect('success');

        state.selectedDate = datePicker.value;
        state.selectedTime = timePicker.value;

        // Beautiful formatted date
        // Output format: e.g. Friday, Aug 21, 2026
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        const dateObj = new Date(state.selectedDate + 'T00:00:00'); // enforce local timeZone creation
        const formattedDate = dateObj.toLocaleDateString('en-US', dateOptions);

        // Formatted Time
        // Output format: e.g. 6:00 PM
        const [hoursStr, minutesStr] = state.selectedTime.split(':');
        const hours = parseInt(hoursStr, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedTime = `${formattedHours}:${minutesStr} ${ampm}`;

        // Populate summary panel properties
        const planIcons = {
            'Amala Date': '🍛 Amala Date',
            'Shopping Date': '🛍️ Shopping Date',
            'Park Date': '🌳 Park Date',
            'Beach Date': '🏖️ Beach Date'
        };
        
        summaryPlan.textContent = planIcons[state.selectedDateType] || state.selectedDateType;
        summaryDate.textContent = formattedDate;
        summaryTime.textContent = formattedTime;

        // Navigate to final confirmation card screen
        navigateTo('confirmation');

        // Continuous decorative sparkles
        const burstTimer = setInterval(() => {
            const x = Math.random() * canvas.width;
            const y = canvas.height + 10;
            spawnExplosion(x, y - (Math.random() * 300), Math.floor(Math.random() * 8) + 6);
        }, 900);

        // Stop continuous burst loop after 10 bursts
        setTimeout(() => {
            clearInterval(burstTimer);
        }, 9000);
    });

});
