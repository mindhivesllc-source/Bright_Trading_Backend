const axios = require('axios');
require('dotenv').config();

function readTokenExpiry(token) {
  try {
    const payloadSegment = token.split(".")[1];
    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(
      Buffer.from(padded, "base64").toString("utf8"),
    );
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function test() {
  const baseUrl = process.env.KIRA_API_BASE_URL || 'https://api.kiradiam.com/api/ApiOrder';
  const username = process.env.KIRA_USERNAME;
  const password = process.env.KIRA_PASSWORD;

  const loginRes = await axios.post(`${baseUrl}/VerifyUser`, null, {
    params: { username, password }
  });
  
  let token = loginRes.data;
  if (typeof token === 'object') token = token.token || token.accessToken;

  const exp = readTokenExpiry(token);
  console.log('Token expires at:', exp, new Date(exp));
  console.log('Current time:', Date.now(), new Date());
}

test();
