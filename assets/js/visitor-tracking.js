
/**
 * ======================================
 * Visitor Tracking System
 * Sends email notification on page visit
 * ======================================
 */
(function () {
    // Initialize EmailJS
    // IMPORTANT: You must sign up at https://www.emailjs.com/
    // get your Public Key, Service ID, and Template ID.
    // Replace 'YOUR_PUBLIC_KEY', 'YOUR_SERVICE_ID', etc. below.
    emailjs.init("lAqcsmVv4agVluBHz");

    // --- UI Handlers ---
    const modal = document.getElementById('sayHiModal');
    const confirmBtn = document.getElementById('confirmSayHi');
    const cancelBtn = document.getElementById('cancelSayHi');

    // Auto-trigger modal after 5 seconds
    window.addEventListener('load', () => {
        // Check if we already showed it this session to be less annoying
        if (!sessionStorage.getItem('say_hi_modal_shown')) {
            setTimeout(() => {
                if (modal) {
                    modal.classList.add('active');
                    sessionStorage.setItem('say_hi_modal_shown', 'true');
                }
            }, 5000); // 5 seconds delay
        }
    });

    if (modal && confirmBtn && cancelBtn) {
        // 2. Cancel closes modal
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // 3. Confirm sends the wave
        confirmBtn.addEventListener('click', async () => {
            // UI Loading State
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = 'Sending...';
            confirmBtn.disabled = true;

            // Trigger Tracking
            await trackVisitor();

            // UI Success State
            confirmBtn.innerHTML = 'Sent! 🚀';

            // Close after short delay
            setTimeout(() => {
                modal.classList.remove('active');
                // Reset button for next time
                setTimeout(() => {
                    confirmBtn.innerHTML = originalText;
                    confirmBtn.disabled = false;
                }, 500);
            }, 1500);
        });
    }

    async function trackVisitor() {
        // 1. Unique Visitor Identification
        let visitorId = localStorage.getItem('portfolio_visitor_id');
        let visitCount = parseInt(localStorage.getItem('portfolio_visit_count') || '0');

        if (!visitorId) {
            visitorId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('portfolio_visitor_id', visitorId);
        }

        visitCount++;
        localStorage.setItem('portfolio_visit_count', visitCount);

        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            const templateParams = {
                to_email: "venkateshseenu45@gmail.com",
                subject: `Wave from Visitor: ${visitorId}`,
                visitor_id: visitorId,
                visit_count: visitCount,
                ip_address: data.ip || 'Unknown',
                country: data.country_name || 'Unknown',
                region: data.region || 'Unknown',
                city: data.city || 'Unknown',
                isp: data.org || 'Unknown',
                user_agent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screen_res: `${window.screen.width}x${window.screen.height}`,
                visit_time: new Date().toString()
            };

            await emailjs.send('service_hzvc7x6', 'template_f72dxuq', templateParams);
            console.log('Visitor notification sent!');

        } catch (error) {
            console.error('Tracking Error:', error);
            // Optional: Handle error UI here if needed
        }
    }
})();
