const https = require('https');

const token = 'sbp_e52102ba8f032f4416a53ccd430b41f463f36f0d';
const projectRef = 'ejensxkdsiamkibgwtnv';

// Get auth config
const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${projectRef}/config/auth`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

console.log('Checking Authentication Configuration...\n');

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const config = JSON.parse(data);
            console.log('Auth Configuration:');
            console.log('==================');
            console.log(`SITE_URL: ${config.SITE_URL || 'Not set'}`);
            console.log(`MAILER_AUTOCONFIRM: ${config.MAILER_AUTOCONFIRM || 'false'}`);
            console.log(`SMTP_HOST: ${config.SMTP_HOST || 'Using Supabase default'}`);
            console.log(`SMTP_ADMIN_EMAIL: ${config.SMTP_ADMIN_EMAIL || 'Not set'}`);
            console.log(`DISABLE_SIGNUP: ${config.DISABLE_SIGNUP || 'false'}`);
            console.log(`EXTERNAL_EMAIL_ENABLED: ${config.EXTERNAL_EMAIL_ENABLED || 'true'}`);
            console.log('\n');
            console.log('Full config:', JSON.stringify(config, null, 2));
        } catch (e) {
            console.log('Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.end();
