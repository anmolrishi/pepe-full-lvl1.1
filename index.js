const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { db } = require('./src/config/firebase');
const dialerService = require('./src/services/dialerService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Caller endpoints
const callerIds = ['caller1', 'caller2', 'caller3', 'caller4', 'caller5', 'caller6', 'caller7'];

callerIds.forEach((callerId) => {
  app.post(`/api/${callerId}`, async (req, res) => {
    try {
      const {
        to_number,
        first_name,
        address,
        Surplus_Amount,
        GHL_TAG,
        total_fee,
        auction_date,
        final_judgement_amount,
        county,
        owner_name,
        current_date,
        ...additionalFields
      } = req.body;

      if (!to_number) {
        return res.status(400).json({ error: 'to_number is required' });
      }

      const callerNumber = parseInt(callerId.replace('caller', ''));
      const from_number = process.env[`FROM_NUMBER_${callerNumber}`];

      if (!from_number) {
        return res.status(500).json({ error: `FROM_NUMBER_${callerNumber} not configured` });
      }

      const callData = {
        callerId,
        from_number,
        to_number,
        first_name,
        address,
        Surplus_Amount,
        GHL_TAG,
        total_fee,
        auction_date,
        final_judgement_amount,
        county,
        owner_name,
        current_date,
        timestamp: new Date(),
        dialStatus: 'not_dialed',
        ...additionalFields
      };

      // Store in Firebase
      const docRef = await db.collection('calls').add(callData);
      
      // Increment contact count and start polling if needed
      await dialerService.incrementContactCount();
      await dialerService.startPolling();

      res.json({
        success: true,
        message: 'Contact stored successfully',
        id: docRef.id
      });

    } catch (error) {
      console.error(`Error in ${callerId}:`, error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});