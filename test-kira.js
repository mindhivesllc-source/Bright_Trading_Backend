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
  console.log("Token:", token.substring(0, 10) + "...");

  for (let limit of [20000, 30000, 40000, 50000]) {
    try {
      console.log(`Trying POST with ${limit}`);
      await axios.post(`${baseUrl}/GetStockDetailForThirdPartyCSV`, null, {
        params: { pagestart: 1, pageend: limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`POST with ${limit} SUCCESS`);
    } catch(e) {
      console.log(`POST with ${limit} FAILED:`, e.response?.status, e.message);
      break;
    }
  }
}

test();
