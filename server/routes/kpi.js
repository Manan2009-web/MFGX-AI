import express from 'express';
import { db } from '../config/db.js';
import { generateDashboardSummary } from '../services/gemini.js';

const router = express.Router();

router.get('/', async (req, res) => {
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

    if (records.length === 0) {
      return res.status(200).json({
        summary: {
          factoryOee: 0,
          totalDowntime: 0,
          averageScrapRate: 0,
          averageInventory: 0,
          aiSummary: 'No manufacturing logs found. Please run the seed script to populate the database.'
        },
        machines: {},
        trends: [],
        downtimeSummary: {}
      });
    }

    // 1. Calculate General Aggregations
    let sumOee = 0;
    let sumScrap = 0;
    let totalDowntime = 0;
    let sumInventory = 0;

    // Structure to group metrics by machine
    const machinesData = {
      'Line 1': { oeeSum: 0, scrapSum: 0, downtimeSum: 0, inventorySum: 0, count: 0, latestInventory: 0, latestTimestamp: new Date(0) },
      'Line 2': { oeeSum: 0, scrapSum: 0, downtimeSum: 0, inventorySum: 0, count: 0, latestInventory: 0, latestTimestamp: new Date(0) },
      'Line 3': { oeeSum: 0, scrapSum: 0, downtimeSum: 0, inventorySum: 0, count: 0, latestInventory: 0, latestTimestamp: new Date(0) },
      'Line 4': { oeeSum: 0, scrapSum: 0, downtimeSum: 0, inventorySum: 0, count: 0, latestInventory: 0, latestTimestamp: new Date(0) }
    };

    // Reason code durations
    const downtimeReasons = {
      'changeover': 0,
      'breakdown': 0,
      'material shortage': 0,
      'maintenance': 0
    };

    // Trend grouping by day (YYYY-MM-DD)
    const trendsByDay = {};

    records.forEach(r => {
      // General sums
      sumOee += r.oee;
      sumScrap += r.scrapRate;
      totalDowntime += r.downtimeDuration;
      sumInventory += r.inventoryLevel;

      // Machine sums
      const m = machinesData[r.machineName];
      if (m) {
        m.oeeSum += r.oee;
        m.scrapSum += r.scrapRate;
        m.downtimeSum += r.downtimeDuration;
        m.inventorySum += r.inventoryLevel;
        m.count += 1;

        // Keep track of latest inventory by timestamp
        if (r.timestamp > m.latestTimestamp) {
          m.latestTimestamp = r.timestamp;
          m.latestInventory = r.inventoryLevel;
        }
      }

      // Downtime reasons
      if (r.downtimeReason && r.downtimeDuration > 0) {
        downtimeReasons[r.downtimeReason] = (downtimeReasons[r.downtimeReason] || 0) + r.downtimeDuration;
      }

      // Group trends by date string (e.g., "Aug 15")
      const dateStr = r.timestamp.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      if (!trendsByDay[dateStr]) {
        trendsByDay[dateStr] = {
          date: dateStr,
          oeeSum: 0,
          scrapSum: 0,
          downtimeSum: 0,
          count: 0,
          machines: {
            'Line 1': { oeeSum: 0, count: 0 },
            'Line 2': { oeeSum: 0, count: 0 },
            'Line 3': { oeeSum: 0, count: 0 },
            'Line 4': { oeeSum: 0, count: 0 }
          }
        };
      }
      
      const dayData = trendsByDay[dateStr];
      dayData.oeeSum += r.oee;
      dayData.scrapSum += r.scrapRate;
      dayData.downtimeSum += r.downtimeDuration;
      dayData.count += 1;

      if (dayData.machines[r.machineName]) {
        dayData.machines[r.machineName].oeeSum += r.oee;
        dayData.machines[r.machineName].count += 1;
      }
    });

    const totalRecords = records.length;
    const factoryOee = Math.round((sumOee / totalRecords) * 10) / 10;
    const averageScrapRate = Math.round((sumScrap / totalRecords) * 100) / 100;
    const averageInventory = Math.round(sumInventory / totalRecords);

    // Format Machine metrics
    const machinesResponse = {};
    const machineOees = {};
    const downtimeByMachine = {};
    const anomalies = [];

    Object.keys(machinesData).forEach(name => {
      const m = machinesData[name];
      if (m.count > 0) {
        const avgOee = Math.round((m.oeeSum / m.count) * 10) / 10;
        const avgScrap = Math.round((m.scrapSum / m.count) * 100) / 100;
        const totDown = Math.round(m.downtimeSum * 10) / 10;

        machinesResponse[name] = {
          oee: avgOee,
          scrapRate: avgScrap,
          downtime: totDown,
          inventory: m.latestInventory
        };

        machineOees[name] = avgOee;
        downtimeByMachine[name] = totDown;

        // Detect anomaly triggers
        if (avgOee < 75) {
          anomalies.push(`${name} efficiency is low, averaging ${avgOee}% OEE.`);
        }
        if (avgScrap > 2.5) {
          anomalies.push(`${name} scrap rate is elevated at ${avgScrap}%.`);
        }
        if (totDown > 4) {
          anomalies.push(`${name} experienced high downtime of ${totDown} hours.`);
        }
      }
    });

    // Format Trend Data
    const trends = Object.values(trendsByDay).map(day => {
      const dailyOee = Math.round((day.oeeSum / day.count) * 10) / 10;
      const dailyScrap = Math.round((day.scrapSum / day.count) * 100) / 100;
      const dailyDowntime = Math.round(day.downtimeSum * 10) / 10;

      const result = {
        date: day.date,
        oee: dailyOee,
        scrapRate: dailyScrap,
        downtime: dailyDowntime
      };

      // Add line specific OEEs for detailed view
      Object.keys(day.machines).forEach(line => {
        const lm = day.machines[line];
        if (lm.count > 0) {
          result[`${line} OEE`] = Math.round((lm.oeeSum / lm.count) * 10) / 10;
        }
      });

      return result;
    });

    // 2. Generate AI Dashboard Summary via Claude
    const aiSummaryInput = {
      factoryOee,
      machineOees,
      totalDowntime: Math.round(totalDowntime * 10) / 10,
      downtimeByMachine,
      averageScrapRate,
      anomalies
    };

    const aiSummary = await generateDashboardSummary(aiSummaryInput);

    // 3. Send final response
    res.status(200).json({
      summary: {
        factoryOee,
        totalDowntime: Math.round(totalDowntime * 10) / 10,
        averageScrapRate,
        averageInventory,
        aiSummary
      },
      machines: machinesResponse,
      trends,
      downtimeSummary: downtimeReasons
    });

  } catch (error) {
    console.error('Error fetching KPI dashboard data:', error);
    res.status(500).json({ error: 'Server error retrieving KPI dashboard data' });
  }
});

export default router;
