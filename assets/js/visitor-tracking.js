
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

    async function trackVisitor() {
        // 1. Unique Visitor Identification (The "Cookie" part)
        // We generate a unique ID for this browser and save it.
        // If they come back, we know it's the same person/device (Visitor #xyz).
        let visitorId = localStorage.getItem('portfolio_visitor_id');
        let visitCount = parseInt(localStorage.getItem('portfolio_visit_count') || '0');

        if (!visitorId) {
            // New Visitor: Generate a random unique ID
            visitorId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('portfolio_visitor_id', visitorId);
        }

        // Increment visit count
        visitCount++;
        localStorage.setItem('portfolio_visit_count', visitCount);

        // Check if we notified about this session recently to avoid spamming yourself
        // (e.g., only email once per 1 hour session)
        const lastSent = sessionStorage.getItem('visitor_log_sent_session');
        if (lastSent) {
            console.log('Already logged this session.');
            return;
        }

        try {
            // 2. Fetch Technical Data (IP, Location) - This is public info
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            // 3. Prepare Email Data
            // NOTE: It is technically impossible to get 'Email' or 'Real Name' 
            // from a visitor automatically due to browser security policies.
            // We can only track their Device, IP, Location, and assign a unique ID.
            const templateParams = {
                to_email: "venkateshseenu45@gmail.com", // Your email
                subject: `New Visitor Alert: ${visitorId}`,

                // Visitor Identity
                visitor_id: visitorId,
                visit_count: visitCount,

                // Location & Network
                ip_address: data.ip || 'Unknown',
                country: data.country_name || 'Unknown',
                region: data.region || 'Unknown',
                city: data.city || 'Unknown',
                isp: data.org || 'Unknown',

                // Device Info
                user_agent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screen_res: `${window.screen.width}x${window.screen.height}`,

                visit_time: new Date().toString()
            };

            // 4. Send Email via EmailJS
            // Replace with your actual Service ID and Template ID
            await emailjs.send('service_hzvc7x6', 'template_f72dxuq', templateParams);

            console.log('Visitor notification sent!');
            sessionStorage.setItem('visitor_log_sent_session', 'true');

        } catch (error) {
            console.error('Tracking Error:', error);
        }
    }

    // specific delay to ensure page load doesn't block
    window.addEventListener('load', () => setTimeout(trackVisitor, 2000));
})();
