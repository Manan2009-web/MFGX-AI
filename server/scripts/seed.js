import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';

// Resolve directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root first, then server folder fallback
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const machines = ['Line 1', 'Line 2', 'Line 3', 'Line 4'];
const reasons = ['changeover', 'breakdown', 'material shortage', 'maintenance'];

// Helper to generate a random number within a range
const randomRange = (min, max) => Math.random() * (max - min) + min;
const randomIntRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to delete all documents in a collection in batches of 500
async function clearCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.size === 0) {
    console.log(`No existing documents found in ${collectionName}.`);
    return;
  }

  console.log(`Found ${snapshot.size} existing records in ${collectionName}. Deleting in batches of 500...`);
  
  let batch = db.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    
    if (count === 500) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  console.log(`Cleared all records from ${collectionName}.`);
}

// Helper to insert documents in batches of 500
async function insertRecords(records) {
  let batch = db.batch();
  let count = 0;
  
  for (const record of records) {
    const docRef = db.collection('records').doc();
    batch.set(docRef, record);
    count++;
    
    if (count === 500) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  console.log(`Successfully inserted all ${records.length} records.`);
}

async function seedDatabase() {
  try {
    if (!db) {
      console.error('Firestore is not initialized. Make sure Firebase credentials are set in environment variables.');
      process.exit(1);
    }
    
    console.log('Firebase connection active. Clearing existing records in Firestore...');
    await clearCollection('records');

    const records = [];
    const now = new Date();
    // 7 days ago
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Let's create seed records hour-by-hour for each machine
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const recordTime = new Date(startDate.getTime() + (day * 24 + hour) * 60 * 60 * 1000);

        machines.forEach(machine => {
          // Default baselines
          let baseOEE = 82; // %
          let baseScrap = 1.8; // %
          let baseDowntime = 0; // hrs
          let downtimeReason = null;
          let inventoryBase = 500;

          // Introduce variation depending on the machine
          if (machine === 'Line 1') {
            baseOEE = randomRange(80, 92);
            baseScrap = randomRange(1.0, 2.2);
            inventoryBase = 600;
          } else if (machine === 'Line 2') {
            baseOEE = randomRange(75, 87);
            baseScrap = randomRange(1.5, 2.8);
            inventoryBase = 750;
          } else if (machine === 'Line 3') {
            baseOEE = randomRange(78, 86);
            baseScrap = randomRange(1.2, 2.4);
            inventoryBase = 400;

            // Scenario: Line 3 had a major mechanical breakdown on Day 5 (hours 10 to 14)
            if (day === 4 && hour >= 10 && hour <= 14) {
              baseOEE = randomRange(30, 45);
              baseDowntime = randomRange(0.8, 1.0); // nearly full hour down
              downtimeReason = 'breakdown';
              baseScrap = randomRange(4.0, 6.5); // high scrap during recovery
            }
          } else if (machine === 'Line 4') {
            baseOEE = randomRange(83, 94);
            baseScrap = randomRange(0.8, 1.8);
            inventoryBase = 900;

            // Scenario: Line 4 had a material shortage on Day 3 (hours 16 to 19)
            if (day === 2 && hour >= 16 && hour <= 19) {
              baseOEE = randomRange(40, 55);
              baseDowntime = randomRange(0.6, 0.9);
              downtimeReason = 'material shortage';
            }
            // Scenario: Line 4 had high scrap on Day 2 due to calibration issues
            if (day === 1 && hour >= 8 && hour <= 12) {
              baseScrap = randomRange(4.5, 7.5);
              baseOEE = baseOEE - 10; // slightly lower OEE due to rework
            }
          }

          // Random minor downtime incidents (1% chance for any hour if not already down)
          if (baseDowntime === 0 && Math.random() < 0.02) {
            baseDowntime = randomRange(0.2, 0.6); // 12-36 mins
            downtimeReason = reasons[randomIntRange(0, reasons.length - 1)];
            baseOEE = baseOEE - (baseDowntime * 60); // Drop OEE proportionally
          }

          // Bound OEE and scrap
          baseOEE = Math.max(10, Math.min(100, baseOEE));
          baseScrap = Math.max(0.1, Math.min(15, baseScrap));

          // Inventory fluctuations (producing adds to inventory, shipping deducts)
          // Let's create a cyclic inventory trend
          const hourOffset = day * 24 + hour;
          const cycle = Math.sin(hourOffset / 6) * 100; // oscillating inventory
          const inventory = Math.round(inventoryBase + cycle + randomIntRange(-20, 20));

          records.push({
            machine: machine,
            date: recordTime,
            oee: Math.round(baseOEE * 10) / 10,
            downtime: Math.round(baseDowntime * 10) / 10,
            downtimeReason: downtimeReason,
            scrapRate: Math.round(baseScrap * 100) / 100,
            inventory: Math.max(50, inventory)
          });
        });
      }
    }

    console.log(`Generated ${records.length} records. Inserting into Firestore...`);
    await insertRecords(records);
    console.log('Database seeded successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    console.log('Seed operations finished.');
  }
}

seedDatabase();
