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

  const res = await axios.post(`${baseUrl}/GetStockDetailForThirdPartyCSV`, null, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const lines = res.data.split('\n');
  console.log('Number of lines without params:', lines.length);
}

test();
