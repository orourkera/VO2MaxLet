import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>VO2Max API Debug</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
      margin: 0;
      padding: 20px;
      background: #f7f8fa;
      color: #333;
      line-height: 1.5;
    }
    h1, h2 {
      color: #1a202c;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    pre {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .btn {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 8px;
    }
    .btn:hover {
      background: #4338ca;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f8fafc;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>VO2Max API Debug UI</h1>
    
    <div class="card">
      <h2>Environment Info</h2>
      <pre id="env-info">Loading...</pre>
    </div>
    
    <div class="card">
      <h2>API Calls</h2>
      <div>
        <button class="btn" id="refresh-calls">Refresh</button>
        <button class="btn" id="clear-calls">Clear History</button>
      </div>
      <div id="api-calls" style="margin-top: 15px;">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Method</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody id="api-calls-body">
            <tr>
              <td colspan="3">Loading...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Page State</h2>
      <pre id="page-state">Loading...</pre>
    </div>
  </div>

  <script>
    // Fetch environment info
    async function fetchEnvInfo() {
      try {
        const response = await fetch('/api/debug-env');
        const data = await response.json();
        document.getElementById('env-info').textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        document.getElementById('env-info').textContent = 'Error: ' + error.message;
      }
    }

    // Utility to get tracked API calls from our custom tracker
    function getApiCalls() {
      if (window.apiTracker && window.apiTracker.getApiCalls) {
        return window.apiTracker.getApiCalls();
      }
      return [];
    }

    // Render API calls table
    function renderApiCalls() {
      const calls = getApiCalls();
      const tbody = document.getElementById('api-calls-body');
      
      if (calls.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No API calls tracked yet</td></tr>';
        return;
      }
      
      tbody.innerHTML = '';
      calls.forEach(call => {
        const row = document.createElement('tr');
        
        row.innerHTML = \`
          <td>\${call.timestamp}</td>
          <td>\${call.method}</td>
          <td>\${call.url}</td>
        \`;
        
        tbody.appendChild(row);
      });
    }

    // Clear API calls
    function clearApiCalls() {
      if (window.apiTracker && window.apiTracker.clearApiCalls) {
        window.apiTracker.clearApiCalls();
        renderApiCalls();
      }
    }

    // Get page state
    function getPageState() {
      const state = {
        location: window.location.toString(),
        localStorage: {},
        sessionStorage: {},
      };
      
      // Safe access to storage
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            state.localStorage[key] = localStorage.getItem(key);
          }
        }
        
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            state.sessionStorage[key] = sessionStorage.getItem(key);
          }
        }
      } catch (e) {
        state.storageError = e.message;
      }
      
      document.getElementById('page-state').textContent = JSON.stringify(state, null, 2);
    }

    // Setup event listeners
    document.getElementById('refresh-calls').addEventListener('click', renderApiCalls);
    document.getElementById('clear-calls').addEventListener('click', clearApiCalls);

    // Initialize
    fetchEnvInfo();
    renderApiCalls();
    getPageState();

    // Create/update tracker in global scope for access from other pages
    window.apiTracker = window.apiTracker || {
      calls: [],
      getApiCalls: function() { return this.calls; },
      clearApiCalls: function() { this.calls = []; }
    };

    // Poll for updates
    setInterval(() => {
      renderApiCalls();
      getPageState();
    }, 5000);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
} 