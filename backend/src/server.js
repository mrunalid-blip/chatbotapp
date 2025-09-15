require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors())
app.use(express.json());

// Import routes
const testRoutes = require('./routes/test.routes'); 
const chatRoutes = require('./routes/chat.routes');
const zohoRoutes = require('./routes/zoho.routes');

// Mount routes
app.use('/api/test', testRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/zoho-data', zohoRoutes);

// Root
app.get('/', (req, res) => {
  res.send('🚀 Chatbot Backend running');
});


// Basic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
