/**
 * MFGX AI API service client
 */

// Retrieve the API base URL from Vite environment variables (stripping trailing slash if present)
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Fetch KPI aggregated metrics and trends
 * @returns {Promise<Object>}
 */
export async function fetchKpis() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/kpi`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    throw error;
  }
}

/**
 * Send query to the AI Copilot
 * @param {string} message - The user query
 * @param {Array<Object>} history - Recent messages history [{ sender: 'user'|'bot', text: string }]
 * @returns {Promise<Object>}
 */
export async function askCopilot(message, history) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/copilot/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error communicating with Copilot:', error);
    throw error;
  }
}
