const zohoClient = require('../services/zoho.client');

let User = null;
try {
  User = require('../models/user.model'); // if you create this later, controller will use it
} catch (e) {
  // ignore if model does not exist yet
}

exports.getZohoDataForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Try to get email from DB user, otherwise accept query param ?email=
    let email = null;
    if (User) {
      const user = await User.findById(userId).lean().exec();
      if (user && user.email) email = user.email;
    }

    if (!email) {
      email = req.query.email; // convenient for testing: /api/zoho-data/abc?email=test@example.com
    }

    if (!email) {
      return res.status(400).json({ error: 'No email found for user. Pass ?email= for testing or add a User model.' });
    }

    // fetch from Zoho client (stub or real based on your env)
    const crmData = await zohoClient.getZohoCrmDataByEmail(email);
    const chatHistory = await zohoClient.getZohoSalesIQDataByEmail(email);

    // return sanitized object (sanitization can be done in a utils function)
    res.json({
      crmData,
      chatHistory
    });
  } catch (err) {
    console.error('zoho.controller.getZohoDataForUser error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
