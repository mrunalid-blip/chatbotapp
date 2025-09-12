const axios = require('axios');

async function getZohoCrmDataByEmail(email) {
  if (!process.env.ZOHO_ACCESS_TOKEN) {
    // mock response for dev
    return { data: [{ Full_Name: 'Test User', Company: 'ACME Corp', Stage: 'Prospect', email }] };
  }

  try {
    const url = 'https://www.zohoapis.com/crm/v2/Contacts/search';
    const resp = await axios.get(url, {
      params: { email },
      headers: { Authorization: `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}` }
    });
    return resp.data;
  } catch (err) {
    console.error('zoho.client.getZohoCrmDataByEmail error', err?.response?.data || err.message);
    throw err;
  }
}

async function getZohoSalesIQDataByEmail(email) {
  if (!process.env.ZOHO_ACCESS_TOKEN) {
    return { conversations: [{ message: 'Asked about pricing', time: new Date().toISOString() }] };
  }

  try {
    // NOTE: replace with actual SalesIQ endpoint for your account/region
    const url = 'https://salesiq.zoho.com/api/v1/your_endpoint_here';
    const resp = await axios.get(url, {
      params: { email },
      headers: { Authorization: `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}` }
    });
    return resp.data;
  } catch (err) {
    console.error('zoho.client.getZohoSalesIQDataByEmail error', err?.response?.data || err.message);
    throw err;
  }
}

module.exports = { getZohoCrmDataByEmail, getZohoSalesIQDataByEmail };
