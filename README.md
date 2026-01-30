# SentinelWeb Prototype — Quick Start

This repository is a prototype for SentinelWeb: frontend dashboard, Collector API, backend agent demo, and a simple ML service for attack detection.

Important: `simple-server.js` has been removed. Use `dashboard-server.js` (Express) to serve the dashboard.

Services and how to run

- ML service (Flask, port 6000)

  ```powershell
  cd "c:\Users\Jayesh\OneDrive\Desktop\project-prototype\ml-service"
  # create venv (use your installed python)
  py -3 -m venv venv
  .\venv\Scripts\Activate.ps1
  pip install --upgrade pip
  pip install flask joblib numpy scikit-learn
  python app.py
  ```

- Collector API (Node, port 5000)

  ```powershell
  cd "c:\Users\Jayesh\OneDrive\Desktop\project-prototype\collector-api"
  npm install
  npm start
  ```

- Backend Agent Demo (Node, port 3000)

  ```powershell
  cd "c:\Users\Jayesh\OneDrive\Desktop\project-prototype\agents\backend-agent"
  npm install
  npm run demo
  ```

- Dashboard (Express, port 3000)

  ```powershell
  cd "c:\Users\Jayesh\OneDrive\Desktop\project-prototype"
  npm install
  npm run start:dashboard
  ```

Notes
- The dashboard (`dashboard.html`) will POST telemetry to `http://localhost:5000/api/collect/frontend` and `/api/collect/backend`.
- The Collector API forwards data to the ML service at `http://localhost:6000/predict` and returns analysis.
- If you are behind a proxy, set `HTTP_PROXY`/`HTTPS_PROXY` before running pip/npm installs.

Ports used by the prototype:
- ML service: 6000
- Collector API: 5000
- Backend demo: 3000
- Dashboard: 3000
