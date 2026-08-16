import express from 'express';
import { db } from '../config/db.js';
import { answerCopilotQuery } from '../services/gemini.js';

const router = express.Router();

router.post('/ask', async (req, res) => {
  const { message, history } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch records in the 7 day window from Firestore
    if (!db) {
      console.warn('Firestore database is not initialized.');
      return res.status(500).json({ error: 'Database is not initialized.' });
    }

    const snapshot = await db.collection('records')
      .where('date', '>=', sevenDaysAgo)
      .orderBy('date', 'asc')
      .get();

    const records = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      records.push({
        machineName: data.machine,
        timestamp: data.date && typeof data.date.toDate === 'function' ? data.date.toDate() : new Date(data.date),
        oee: data.oee,
        downtimeDuration: data.downtime,
        downtimeReason: data.downtimeReason,
        scrapRate: data.scrapRate,
        inventoryLevel: data.inventory
      });
    });

    // Aggregate data for Claude Context
    let sumOee = 0;
    let sumScrap = 0;
    let totalDowntime = 0;
    let sumInventory = 0;

    const machines = {
      'Line 1': { oeeSum: 0, scrapSum: 0, downtimeSum: 0, inventorySum: 0, count: 0, latestInventory: 0, latestTimestamp: new Date(0) },
      'Line 2': { oeeSum: 0, scrapSum: 0, downtimeSum: 0, inventorySum: 0, count: 0, latestInventory: 0, latestTimestamp: new Date(0) },
      'Line 3': { oeeSum: 0, scrapSum: 0, downtimeSum: 0, inventorySum: 0, count: 0, latestInventory: 0, latestTimestamp: new Date(0) },
      'Line 4': { oeeSum: 0, scrapSum: 0, downtimeSum: 0, inventorySum: 0, count: 0, latestInventory: 0, latestTimestamp: new Date(0) }
    };

    const downtimeReasons = {
      'changeover': 0,
      'breakdown': 0,
      'material shortage': 0,
      'maintenance': 0
    };

    records.forEach(r => {
      sumOee += r.oee;
      sumScrap += r.scrapRate;
      totalDowntime += r.downtimeDuration;
      sumInventory += r.inventoryLevel;

      const m = machines[r.machineName];
      if (m) {
        m.oeeSum += r.oee;
        m.scrapSum += r.scrapRate;
        m.downtimeSum += r.downtimeDuration;
        m.inventorySum += r.inventoryLevel;
        m.count += 1;

        if (r.timestamp > m.latestTimestamp) {
          m.latestTimestamp = r.timestamp;
          m.latestInventory = r.inventoryLevel;
        }
      }

      if (r.downtimeReason && r.downtimeDuration > 0) {
        downtimeReasons[r.downtimeReason] = (downtimeReasons[r.downtimeReason] || 0) + r.downtimeDuration;
      }
    });

    const totalRecords = records.length || 1;
    
    // Format summaries
    const summary = {
      factoryOee: Math.round((sumOee / totalRecords) * 10) / 10,
      totalDowntime: Math.round(totalDowntime * 10) / 10,
      averageScrapRate: Math.round((sumScrap / totalRecords) * 100) / 100,
      averageInventory: Math.round(sumInventory / totalRecords)
    };

    const machineDetails = {};
    Object.keys(machines).forEach(name => {
      const m = machines[name];
      if (m.count > 0) {
        machineDetails[name] = {
          oee: Math.round((m.oeeSum / m.count) * 10) / 10,
          scrapRate: Math.round((m.scrapSum / m.count) * 100) / 100,
          downtime: Math.round(m.downtimeSum * 10) / 10,
          inventory: m.latestInventory
        };
      }
    });

    const contextData = {
      summary,
      machines: machineDetails,
      downtimeSummary: downtimeReasons
    };

    // Call Claude service to generate response
    const answer = await answerCopilotQuery(history || [], message, contextData);

    res.status(200).json({
      answer
    });

  } catch (error) {
    console.error('Error in Copilot Q&A endpoint:', error);
    res.status(500).json({ error: 'Server error processing Copilot query' });
  }
});

export default router;
