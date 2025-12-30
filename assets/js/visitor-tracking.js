
/**
 * ======================================
 * Visitor Tracking System
 * Sends email notification on page visit
 * ======================================
 */
(function () {
    // Initialize EmailJS
    // IMPORTANT: Replace 'YOUR_PUBLIC_KEY' with your actual Public Key from EmailJS Dashboard
    emailjs.init("YOUR_PUBLIC_KEY");

    async function trackVisitor() {
        // Prevent spamming your email on every reload - only send once per browser session
        if (sessionStorage.getItem('visitor_log_sent')) {
            console.log('Visitor already logged this session.');
            return;
        }

        try {
            // Fetch Visitor Data (IP, Location)
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            // Prepare Email Parameters
            // Note: 'user_name' is not available for anonymous visitors, so we use 'Guest'
            const templateParams = {
                to_name: "Venkatesh",
                ip_address: data.ip || 'Unknown',
                country: data.country_name || 'Unknown',
                state: data.region || 'Unknown',
                city: data.city || 'Unknown',
                isp: data.org || 'Unknown',
                device_info: navigator.userAgent, // Provides browser/device details
                visit_time: new Date().toLocaleString()
            };

            // Send Email
            // IMPORTANT: Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with actual IDs from EmailJS
            await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);

            console.log('Visitor notification sent successfully!');
            sessionStorage.setItem('visitor_log_sent', 'true');

        } catch (error) {
            console.error('Error tracking visitor:', error);
        }
    }

    // Run tracking when page loads
    window.addEventListener('load', trackVisitor);
})();
