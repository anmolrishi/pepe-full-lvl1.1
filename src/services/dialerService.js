const { db } = require('../config/firebase');
const { createPhoneCall, getConcurrencyStatus, getCallAnalytics } = require('./retellService');

class DialerService {
  constructor() {
    this.isPolling = false;
    this.isAnalyzing = false;
    this.contactsReceived = 0;
    this.contactsDialed = 0;
    this.contactsAnalyzed = 0;
  }

  async startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.pollContacts();
  }

  async updateMetrics() {
    try {
      const pendingAnalysis = this.contactsDialed - this.contactsAnalyzed;
      const metricsRef = db.collection('metrics').doc('dialer');
      await metricsRef.set({
        contactsReceived: this.contactsReceived,
        contactsDialed: this.contactsDialed,
        contactsAnalyzed: this.contactsAnalyzed,
        pendingContacts: this.contactsReceived - this.contactsDialed,
        pendingAnalysis,
        lastUpdated: new Date()
      });

      // Start or stop analysis based on pending analysis count
      if (pendingAnalysis > 0 && !this.isAnalyzing) {
        this.startAnalysis();
      } else if (pendingAnalysis === 0 && this.isAnalyzing) {
        this.isAnalyzing = false;
      }
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  async startAnalysis() {
    if (this.isAnalyzing) return;
    console.log('Starting analysis polling...');
    this.isAnalyzing = true;
    this.pollForAnalysis();
  }

  async pollForAnalysis() {
    while (this.isAnalyzing && (this.contactsDialed > this.contactsAnalyzed)) {
      try {
        const snapshot = await db.collection('calls')
          .where('dialStatus', '==', 'dialed')
          .where('analyzed', '==', false)
          .limit(10)
          .get();

        if (snapshot.empty) {
          console.log('No calls pending analysis');
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        console.log(`Found ${snapshot.size} calls to analyze`);

        const analyzePromises = snapshot.docs.map(async (doc) => {
          const call = doc.data();
          
          try {
            if (!call.callId) {
              console.log(`No callId found for document ${doc.id}`);
              return;
            }

            console.log(`Analyzing call ${call.callId}`);
            const analyticsData = await getCallAnalytics(call.callId, process.env.RETELL_API_KEY);

            if (!analyticsData) {
              console.log(`No analytics data available yet for call ${call.callId}`);
              return;
            }

            if (analyticsData.disconnection_reason) {
              console.log(`Call ${call.callId} completed with reason: ${analyticsData.disconnection_reason}`);
              
              await doc.ref.update({
                ...analyticsData,
                analyzed: true,
                lastAnalysisAttempt: new Date()
              });

              this.contactsAnalyzed++;
              await this.updateMetrics();
            } else {
              console.log(`Call ${call.callId} still in progress`);
              await doc.ref.update({
                lastAnalysisAttempt: new Date()
              });
            }

          } catch (error) {
            console.error(`Error analyzing call ${call.callId}:`, error);
            await doc.ref.update({
              analysisError: error.message,
              lastAnalysisAttempt: new Date()
            });
          }
        });

        await Promise.all(analyzePromises);

        // If no more pending analysis, stop polling
        if (this.contactsDialed === this.contactsAnalyzed) {
          console.log('All calls analyzed, stopping analysis polling');
          this.isAnalyzing = false;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        console.error('Error in analysis polling loop:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('Analysis polling stopped');
    this.isAnalyzing = false;
  }

  async pollContacts() {
    console.log('Starting contact polling...');
    
    while (this.isPolling && (this.contactsReceived > this.contactsDialed)) {
      try {
        const concurrencyStatus = await getConcurrencyStatus(process.env.RETELL_API_KEY);
        const availableConcurrency = concurrencyStatus ? 
          (concurrencyStatus.concurrency_limit - concurrencyStatus.current_concurrency) : 10;

        if (availableConcurrency <= 0) {
          console.log('No available concurrency. Waiting...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        const snapshot = await db.collection('calls')
          .where('dialStatus', '==', 'not_dialed')
          .limit(availableConcurrency)
          .get();

        if (snapshot.empty) {
          console.log('No undailed contacts found');
          await new Promise(resolve => setTimeout(resolve, 120000));
          continue;
        }

        console.log(`Found ${snapshot.size} contacts to dial`);

        const dialPromises = snapshot.docs.map(async (doc) => {
          const contact = doc.data();
          
          try {
            const callResponse = await createPhoneCall(
              contact.from_number,
              contact.to_number,
              process.env.RETELL_API_KEY
            );

            await doc.ref.update({
              dialStatus: 'dialed',
              callId: callResponse.call_id,
              dialedAt: new Date(),
              analyzed: false
            });

            this.contactsDialed++;
            await this.updateMetrics(); // This will trigger analysis if needed

            console.log(`Successfully dialed contact: ${doc.id}`);
          } catch (error) {
            console.error(`Error dialing contact ${doc.id}:`, error);
            await doc.ref.update({
              dialStatus: 'failed',
              error: error.message,
              failedAt: new Date()
            });
          }
        });

        await Promise.all(dialPromises);
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        console.error('Error in polling loop:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('Contact polling complete');
    this.isPolling = false;
  }

  async incrementContactCount() {
    this.contactsReceived++;
    await this.updateMetrics();
  }
}

module.exports = new DialerService();