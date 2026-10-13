const axios = require('axios');
require('dotenv').config();

async function test() {
  const baseUrl = process.env.KIRA_API_BASE_URL || 'https://api.kiradiam.com/api/ApiOrder';
  const username = process.env.KIRA_USERNAME;
  const password = process.env.KIRA_PASSWORD;

  const loginRes = await axios.post(`${baseUrl}/VerifyUser`, null, {
    params: { username, password }
  });
  
  let token = loginRes.data;
  if (typeof token === 'object') token = token.token || token.accessToken;

  try {
    const res = await axios.post(`${baseUrl}/GetStockDetailForThirdPartyCSV`, null, {
      params: { pagestart: 1, pageend: 0 },
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('pageend 0, lines:', res.data.split('\n').length);
  } catch(e) {
    console.log('pageend 0 FAILED:', e.response?.status, e.message);
  }
}

test();
