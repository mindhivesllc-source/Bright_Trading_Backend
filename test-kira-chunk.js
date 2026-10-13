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

  let totalLines = 0;
  const limit = 10000;

  for (let start = 1; start <= 150000; start += limit) {
    const end = start + limit - 1;
    console.log(`Fetching ${start} to ${end}...`);
    try {
      const res = await axios.post(`${baseUrl}/GetStockDetailForThirdPartyCSV`, null, {
        params: { pagestart: start, pageend: end },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text'
      });
      
      let data = res.data;
      if (!data || data.trim().length === 0) {
        console.log('Empty response, breaking.');
        break;
      }
      
      let lines = data.split('\n');
      if (start > 1) {
        lines.shift(); // remove header
      }
      lines = lines.filter(l => l.trim().length > 0);
      
      if (lines.length === 0) {
        console.log('No more records, breaking.');
        break;
      }
      
      totalLines += lines.length;
      console.log(`Fetched ${lines.length} lines. Total: ${totalLines}`);
      
    } catch(e) {
      console.log(`Failed at ${start}-${end}:`, e.response?.status, e.message);
      break;
    }
  }
}

test();
