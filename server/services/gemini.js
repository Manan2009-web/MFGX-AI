import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let genAI = null;
const isMockMode = !apiKey || apiKey === 'your-gemini-api-key-here' || apiKey.trim() === '';

if (!isMockMode) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log(`Gemini AI service initialized with model: ${modelName}`);
  } catch (error) {
    console.error('Failed to initialize Gemini client, falling back to mock mode:', error.message);
  }
} else {
  console.warn('WARNING: GEMINI_API_KEY is missing or placeholder. Running Gemini Service in Mock AI Mode.');
}

/**
 * Generate a 3-4 sentence summary banner for the KPI dashboard.
 * @param {Object} data - Aggregated KPI metrics and anomalies
 */
export async function generateDashboardSummary(data) {
  const prompt = `You are a Principal Manufacturing Systems Engineer. Analyze the following 7-day factory data and write a concise 3-4 sentence operational summary banner. 
Highlight the biggest anomaly or drop in efficiency, identify its cause, and suggest a correction. Keep it professional, direct, and actionable.

DATA CONTEXT:
- Total Factory OEE: ${data.factoryOee}%
- Machine OEEs: ${JSON.stringify(data.machineOees)}
- Total Downtime: ${data.totalDowntime} hours
- Machine Downtime Details: ${JSON.stringify(data.downtimeByMachine)}
- Average Scrap Rate: ${data.averageScrapRate}%
- Key Anomalies Detected: ${JSON.stringify(data.anomalies)}

OUTPUT FORMAT:
Return ONLY the 3-4 sentence text summary. Do not include titles, markdown blocks, greeting remarks, or notes.`;

  if (isMockMode || !genAI) {
    return generateMockSummary(data);
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.2
      }
    });
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating dashboard summary via Gemini:', error);
    return generateMockSummary(data); // Fallback to mock on error
  }
}

/**
 * Answer a natural language query about factory operations.
 * @param {Array} chatHistory - Previous chat messages
 * @param {string} userQuery - The user's input question
 * @param {Object} contextData - Raw aggregated metrics and raw logs for context
 */
export async function answerCopilotQuery(chatHistory, userQuery, contextData) {
  const formattedHistory = chatHistory.map(msg => 
    `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
  ).join('\n');

  const systemPrompt = `You are MFGX AI, an advanced AI Manufacturing Copilot. You assist factory managers by answering questions about machine performance, downtime, scrap rates, and inventory.
You must be factual and grounded. Base your answers strictly on the factory data context provided below. 
If the user's question cannot be answered from the context data, state that you do not have enough data to answer.
Format your responses clearly, using bold text, numbers, or bullet points for readability where appropriate. Keep it concise.

FACTORY DATA CONTEXT (LAST 7 DAYS):
- Machines Monitored: Line 1, Line 2, Line 3, Line 4
- Overall OEE Average: ${contextData.summary.factoryOee}%
- Total Downtime: ${contextData.summary.totalDowntime} hours
- Downtime Reasons: ${JSON.stringify(contextData.downtimeSummary)}
- Average Scrap Rate: ${contextData.summary.averageScrapRate}%
- Average Inventory: ${contextData.summary.averageInventory} units
- Machine-Specific Breakdown: ${JSON.stringify(contextData.machines)}
- Key Events & Anomalies:
  * Line 3 had a major mechanical breakdown on Day 5 (approx 5 hours down, OEE dipped to 35%, scrap spiked to 5.2% during recovery).
  * Line 4 had a material shortage on Day 3 (approx 4 hours down, OEE dipped to 48%).
  * Line 4 had high scrap on Day 2 due to calibration issues (scrap rate averaged 6%).

Recent Chat History:
${formattedHistory}`;

  if (isMockMode || !genAI) {
    // Wait briefly to simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateMockCopilotResponse(userQuery, contextData);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt
    });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userQuery }] }],
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.1
      }
    });
    return result.response.text().trim();
  } catch (error) {
    console.error('Error answering copilot query via Gemini:', error);
    return `[System Connection Error] Falling back to local offline analysis: ${generateMockCopilotResponse(userQuery, contextData)}`;
  }
}

// --- MOCK RESPONSE GENERATORS ---

function generateMockSummary(data) {
  const line3Oee = Math.round(data.machineOees['Line 3'] || 78);
  const line4Downtime = data.downtimeByMachine['Line 4'] || 0;
  
  return `Overall factory operations remain stable at ${data.factoryOee}% OEE, though Line 3 experienced a significant OEE drop to ${line3Oee}% on Day 5 due to mechanical breakdowns. Line 4 also encountered minor downtime (${line4Downtime} hours) on Day 3 driven by material shortages. Scrap rates averaged ${data.averageScrapRate}%, with a notable localized spike on Line 4 due to calibration deviations. Immediate action is recommended to review the preventative maintenance schedule on Line 3 and inspect calibration protocols on Line 4.`;
}

function generateMockCopilotResponse(query, contextData) {
  const q = query.toLowerCase();
  
  if (q.includes('downtime') || q.includes('most down') || q.includes('stop') || q.includes('reason')) {
    return `Based on the last 7 days of factory logs, **Line 3 had the highest accumulated downtime** at **4.5 hours**, primarily caused by a mechanical **breakdown** on Day 5. 

Here is the breakdown of total downtime by machine:
* **Line 3:** 4.5 hours (Major reason: **breakdown**)
* **Line 4:** 3.8 hours (Major reason: **material shortage**)
* **Line 1 & Line 2:** Minimal downtime (< 0.5 hours each)

**Key downtime incidents:**
1. **Line 3 Mechanical Breakdown:** Occurred on Day 5 between hours 10-14, dropping hourly OEE down to 30%.
2. **Line 4 Material Shortage:** Occurred on Day 3 between hours 16-19, halting production.`;
  }
  
  if (q.includes('oee') || q.includes('performance') || q.includes('lowest oee') || q.includes('efficient')) {
    const machines = contextData.machines || {};
    const oees = Object.entries(machines).map(([name, m]) => `* **${name}**: ${m.oee}% OEE`).join('\n');
    return `The average OEE for the factory over the last 7 days is **${contextData.summary.factoryOee}%**.

**Machine-Specific OEE Performance:**
${oees}

**Analysis:**
* **Line 4** is the most efficient line, averaging **${machines['Line 4']?.oee || 88.5}%** OEE.
* **Line 3** recorded the lowest average efficiency at **${machines['Line 3']?.oee || 76.2}%** OEE, heavily weighted down by the Day 5 mechanical failure.`;
  }
  
  if (q.includes('scrap') || q.includes('waste') || q.includes('quality') || q.includes('reject')) {
    return `The average scrap rate across all production lines is **${contextData.summary.averageScrapRate}%**. 

**Quality Highlights:**
* **Line 4 Calibration Issue:** On Day 2, Line 4 suffered from sensor/calibration deviations, resulting in a scrap rate spike that averaged **6.0%** between hours 08:00 and 12:00.
* **Line 3 Startup Scrap:** Following the mechanical breakdown on Day 5, scrap rates spiked to **5.2%** during machine warm-up and recalibration.
* **Line 1 and Line 2** maintained excellent quality, averaging under **1.8%** scrap.`;
  }
  
  if (q.includes('inventory') || q.includes('stock') || q.includes('level')) {
    const machines = contextData.machines || {};
    return `The average inventory level across lines is **${contextData.summary.averageInventory} units**.

**Current Inventory Status:**
* **Line 1:** ${machines['Line 1']?.inventory || 520} units (Stable)
* **Line 2:** ${machines['Line 2']?.inventory || 780} units (High buffer)
* **Line 3:** ${machines['Line 3']?.inventory || 310} units (Low buffer - monitored)
* **Line 4:** ${machines['Line 4']?.inventory || 850} units (High buffer)

All lines currently hold sufficient stock to meet daily shipping requirements. No critical stockouts are forecasted.`;
  }
  
  if (q.includes('hi') || q.includes('hello') || q.includes('help') || q.includes('what can you')) {
    return `Hello! I am your **MFGX AI Manufacturing Copilot**. 

I have access to real-time telemetry from **Line 1, Line 2, Line 3, and Line 4** over the last 7 days. You can ask me questions such as:
* *Which machine had the most downtime this week?*
* *What is the average OEE of our production lines?*
* *Identify any scrap rate anomalies.*
* *What are the current inventory levels for our lines?*

How can I help you manage the shop floor today?`;
  }

  // General query answer based on summary stats
  return `Here is a summary of the factory performance for the last 7 days:

* **Factory OEE:** Average is **${contextData.summary.factoryOee}%**.
* **Downtime:** Total of **${contextData.summary.totalDowntime} hours** logged.
* **Scrap Rate:** Average is **${contextData.summary.averageScrapRate}%**.
* **Inventory Level:** Average is **${contextData.summary.averageInventory} units**.

**Line 3** was the most problematic line due to a mechanical breakdown, while **Line 4** had the highest overall OEE despite a temporary material shortage. If you need details on a specific issue (e.g. downtime, scrap, or inventory), please ask!`;
}
