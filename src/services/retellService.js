const axios = require('axios');

const createPhoneCall = async (fromNumber, toNumber, retellApiKey, retries = 0) => {
  const data = {
    from_number: fromNumber,
    to_number: "+" + toNumber.replace(/\D/g, '')
  };

  try {
    const response = await axios.post(
      "https://api.retellai.com/v2/create-phone-call",
      data,
      {
        headers: {
          Authorization: `Bearer ${retellApiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );
    return response.data;
  } catch (error) {
    if (retries < 3) {
      const delay = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return createPhoneCall(fromNumber, toNumber, retellApiKey, retries + 1);
    }
    throw error;
  }
};

const getConcurrencyStatus = async (retellApiKey) => {
  try {
    const response = await axios.get(
      "https://api.retellai.com/get-concurrency",
      {
        headers: {
          Authorization: `Bearer ${retellApiKey}`,
        },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching concurrency status:", error.message);
    return null;
  }
};

const getCallAnalytics = async (callId, retellApiKey, attempts = 0) => {
  try {
    const response = await axios.get(
      `https://api.retellai.com/v2/get-call/${callId}`,
      {
        headers: {
          Authorization: `Bearer ${retellApiKey}`,
        },
        timeout: 10000,
      }
    );

    const analyticsData = response.data;

    return {
      disconnection_reason: analyticsData.disconnection_reason || null,
      call_transcript: analyticsData.transcript || null,
      call_summary: analyticsData.call_analysis?.call_summary || null,
      call_recording: analyticsData.recording_url || null,
      start_time: analyticsData.start_timestamp ? new Date(analyticsData.start_timestamp) : null,
      end_time: analyticsData.end_timestamp ? new Date(analyticsData.end_timestamp) : null,
      call_duration: analyticsData.start_timestamp && analyticsData.end_timestamp ? 
        (analyticsData.end_timestamp - analyticsData.start_timestamp) / 1000.0 : null,
      user_sentiment: analyticsData.call_analysis?.user_sentiment || null,
      call_direction: analyticsData.direction || null
    };
  } catch (error) {
    console.error(`Error getting call analytics for ${callId}:`, error);
    if (attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      return getCallAnalytics(callId, retellApiKey, attempts + 1);
    }
    return null;
  }
};

module.exports = { createPhoneCall, getConcurrencyStatus, getCallAnalytics };