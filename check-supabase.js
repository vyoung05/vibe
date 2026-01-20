const https = require('https');

const token = 'sbp_e52102ba8f032f4416a53ccd430b41f463f36f0d';

const options = {
    hostname: 'api.supabase.com',
    path: '/v1/projects',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
