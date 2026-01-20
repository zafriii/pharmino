const { getTodayMidnightInTimezone, getAppTimezone } = require('./src/lib/utils');

function testTimezone(tz) {
    process.env.APP_TIMEZONE = tz;
    const midnight = getTodayMidnightInTimezone();
    console.log(`Timezone: ${tz}`);
    console.log(`  App Timezone: ${getAppTimezone()}`);
    console.log(`  Midnight (UTC): ${midnight.toISOString()}`);
    console.log(`  Local String: ${midnight.toLocaleString('en-US', { timeZone: tz })}`);
    console.log('---');
}

console.log('Current System Time:', new Date().toISOString());
console.log('---');

testTimezone('Asia/Dhaka');
testTimezone('UTC');
testTimezone('America/New_York');
testTimezone('Europe/London');
