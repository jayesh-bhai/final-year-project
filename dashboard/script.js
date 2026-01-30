       // Initialize charts
        const attackCtx = document.getElementById('attackChart').getContext('2d');
        const realtimeCtx = document.getElementById('realtimeChart').getContext('2d');

        // Attack Detection Chart
        const attackChart = new Chart(attackCtx, {
            type: 'doughnut',
            data: {
                labels: ['Normal', 'Attack'],
                datasets: [{
                    data: [85, 15],
                    backgroundColor: [
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(247, 37, 133, 0.7)'
                    ],
                    borderColor: [
                        'rgba(76, 201, 240, 1)',
                        'rgba(247, 37, 133, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#fff',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });

        // Real-time Analysis Chart
        const realtimeChart = new Chart(realtimeCtx, {
            type: 'line',
            data: {
                labels: ['0s', '5s', '10s', '15s', '20s', '25s', '30s'],
                datasets: [
                    {
                        label: 'Normal Traffic',
                        data: [65, 59, 80, 81, 56, 55, 70],
                        borderColor: 'rgba(76, 201, 240, 1)',
                        backgroundColor: 'rgba(76, 201, 240, 0.2)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Suspicious Activity',
                        data: [28, 48, 40, 19, 86, 27, 90],
                        borderColor: 'rgba(247, 37, 133, 1)',
                        backgroundColor: 'rgba(247, 37, 133, 0.2)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });

        // Stats tracking
        let totalRequests = 0;
        let attacksDetected = 0;

        // Add log entry function
        function addLogEntry(message) {
            const logContainer = document.getElementById('logContainer');
            const now = new Date();
            const timestamp = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
            
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `<span class="timestamp">${timestamp}</span> ${message}`;
            
            logContainer.insertBefore(logEntry, logContainer.firstChild);
            // Keep only the last 30 log entries
            if (logContainer.children.length > 30) {
                logContainer.removeChild(logContainer.lastChild);
            }
        }

        // Clear log function
        document.getElementById('clearLog').addEventListener('click', function() {
            const logContainer = document.getElementById('logContainer');
            logContainer.innerHTML = '';
            addLogEntry('Log cleared by user');
        });

        // Update stats display
        function updateStats(isAttack) {
            totalRequests++;
            if (isAttack) attacksDetected++;
            
            document.getElementById('totalRequests').textContent = totalRequests;
            document.getElementById('attacksDetected').textContent = attacksDetected;
            
            // Update attack chart
            const normalCount = totalRequests - attacksDetected;
            attackChart.data.datasets[0].data = [normalCount, attacksDetected];
            attackChart.update();
        }

        // Generate test data based on session type
        function generateTestData(type) {
            if (type === 'normal') {
                return {
                    session_duration: Math.floor(Math.random() * 570) + 30, // 30-600
                    page_navigation_rate: Math.floor(Math.random() * 5) + 1, // 1-5
                    input_field_activity: Math.floor(Math.random() * 35) + 5, // 5-40
                    mouse_click_frequency: Math.floor(Math.random() * 45) + 5, // 5-50
                    suspicious_input_patterns: 0,
                    form_submission_rate: Math.floor(Math.random() * 2), // 0-2
                    csrf_token_presence: 1,
                    unusual_headers: 0,
                    client_error_rate: Math.floor(Math.random() * 4), // 0-4
                    failed_login_attempts: Math.floor(Math.random() * 2), // 0-1
                    unusual_sql_queries: 0,
                    response_time: Math.floor(Math.random() * 700) + 100, // 100-800
                    server_error_rate: Math.floor(Math.random() * 2), // 0-1
                    request_rate: Math.floor(Math.random() * 40) + 10, // 10-50
                    unusual_http_methods: 0,
                    ip_reputation_score: Math.floor(Math.random() * 30) + 70, // 70-100
                    brute_force_signatures: 0,
                    suspicious_file_uploads: 0
                };
            } else {
                return {
                    session_duration: Math.floor(Math.random() * 49) + 1, // 1-50
                    page_navigation_rate: Math.floor(Math.random() * 10) + 5, // 5-15
                    input_field_activity: Math.floor(Math.random() * 5), // 0-5
                    mouse_click_frequency: Math.floor(Math.random() * 10), // 0-10
                    suspicious_input_patterns: 1,
                    form_submission_rate: Math.floor(Math.random() * 7) + 3, // 3-10
                    csrf_token_presence: 0,
                    unusual_headers: 1,
                    client_error_rate: Math.floor(Math.random() * 10) + 5, // 5-15
                    failed_login_attempts: Math.floor(Math.random() * 7) + 3, // 3-10
                    unusual_sql_queries: 1,
                    response_time: Math.floor(Math.random() * 2200) + 800, // 800-3000
                    server_error_rate: Math.floor(Math.random() * 10) + 5, // 5-15
                    request_rate: Math.floor(Math.random() * 400) + 100, // 100-500
                    unusual_http_methods: 1,
                    ip_reputation_score: Math.floor(Math.random() * 50), // 0-50
                    brute_force_signatures: 1,
                    suspicious_file_uploads: 1
                };
            }
        }

        // Send data to frontend endpoint
        document.getElementById('sendFrontendData').addEventListener('click', async function() {
            const sessionType = document.getElementById('sessionType').value;
            const testData = generateTestData(sessionType);
            
            addLogEntry(`Sending ${sessionType} frontend data to Collector API...`);
            
            try {
                const response = await fetch('http://localhost:5000/api/collect/frontend', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testData)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                const isAttack = result.analysis.is_attack === 1;
                updateStats(isAttack);
                
                addLogEntry(`Frontend data sent successfully. Analysis: is_attack=${result.analysis.is_attack}, probability=${result.analysis.probability.toFixed(4)}`);
                
                const resultDiv = document.getElementById('result');
                resultDiv.style.display = 'block';
                
                if (isAttack) {
                    resultDiv.className = 'result attack';
                    resultDiv.textContent = `🚨 ATTACK DETECTED! Probability: ${(result.analysis.probability * 100).toFixed(2)}%`;
                } else {
                    resultDiv.className = 'result normal';
                    resultDiv.textContent = `✅ Normal Activity. Probability of attack: ${(result.analysis.probability * 100).toFixed(2)}%`;
                }
            } catch (error) {
                addLogEntry(`Error sending frontend data: ${error.message}`);
                console.error('Error:', error);
                
                const resultDiv = document.getElementById('result');
                resultDiv.style.display = 'block';
                resultDiv.className = 'result attack';
                resultDiv.textContent = `❌ Connection Error: Could not reach Collector API`;
            }
        });

        // Send data to backend endpoint
        document.getElementById('sendBackendData').addEventListener('click', async function() {
            const sessionType = document.getElementById('sessionType').value;
            const testData = generateTestData(sessionType);
            
            addLogEntry(`Sending ${sessionType} backend data to Collector API...`);
            
            try {
                const response = await fetch('http://localhost:5000/api/collect/backend', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testData)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                const isAttack = result.analysis.is_attack === 1;
                updateStats(isAttack);
                
                addLogEntry(`Backend data sent successfully. Analysis: is_attack=${result.analysis.is_attack}, probability=${result.analysis.probability.toFixed(4)}`);
                
                const resultDiv = document.getElementById('result');
                resultDiv.style.display = 'block';
                
                if (isAttack) {
                    resultDiv.className = 'result attack';
                    resultDiv.textContent = `🚨 ATTACK DETECTED! Probability: ${(result.analysis.probability * 100).toFixed(2)}%`;
                } else {
                    resultDiv.className = 'result normal';
                    resultDiv.textContent = `✅ Normal Activity. Probability of attack: ${(result.analysis.probability * 100).toFixed(2)}%`;
                }
            } catch (error) {
                addLogEntry(`Error sending backend data: ${error.message}`);
                console.error('Error:', error);
                
                const resultDiv = document.getElementById('result');
                resultDiv.style.display = 'block';
                resultDiv.className = 'result attack';
                resultDiv.textContent = `❌ Connection Error: Could not reach Collector API`;
            }
        });

        // Initial log entry
        addLogEntry("Dashboard loaded and ready for testing. All services are running.");