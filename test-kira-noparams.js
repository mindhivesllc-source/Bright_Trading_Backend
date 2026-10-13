const axios = require('axios');
require('dotenv').config();

async function test() {
  const baseUrl = process.env.KIRA_API_BASE_URL || 'https://api.kiradiam.com/api/ApiOrder';
  const username = process.env.KIRA_USERNAME;
  const password = process.env.KIRA_PASSWORD;

  console.log("Logging in...");
  const loginRes = await axios.post(`${baseUrl}/VerifyUser`, null, {
    params: { username, password }
  });
  
  let token = loginRes.data;
  if (typeof token === 'object') token = token.token || token.accessToken;

  try {
    console.log(`Trying POST with no params`);
    const res = await axios.post(`${baseUrl}/GetStockDetailForThirdPartyCSV`, null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`POST SUCCESS. Data length:`, res.data.length);
  } catch(e) {
    console.log(`POST FAILED:`, e.response?.status, e.message);
  }
}

test();
