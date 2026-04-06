// Quick test - schedule with CORRECT department_id
// Usage: node test_api.js <access_token>

const https = require('https');
const token = process.argv[2];
if (!token) { console.error('Usage: node test_api.js <access_token>'); process.exit(1); }

const scheduleTime = Date.now() + (2 * 60 * 60 * 1000);
const scheduleUpto = scheduleTime + (60 * 60 * 1000);

console.log('Schedule time:', new Date(scheduleTime).toISOString());

const body = {
  mode: 'SCHEDULE',
  title: 'Test Session',
  customer_email: 'prince@counts.ac',
  schedule_time: scheduleTime,
  schedule_upto: scheduleUpto,
  reminder: 15,
  utc_offset: '+05:30',
  time_zone: 'Asia/Kolkata',
  department_id: '299031000000000411',  // CORRECT department ID from /user response
};

const bodyStr = JSON.stringify(body);
console.log('\nBody:', JSON.stringify(body, null, 2));

const req = https.request({
  hostname: 'assist.zoho.in',
  path: '/api/v2/session/schedule',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Zoho-oauthtoken ${token}`,
    'Content-Length': Buffer.byteLength(bodyStr),
  },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('\nHTTP Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (err) => console.log('ERROR:', err.message));
req.write(bodyStr);
req.end();
