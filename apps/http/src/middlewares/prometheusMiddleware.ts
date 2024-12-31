import promClient from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import { Pushgateway } from 'prom-client';

// Create a Registry
export const register = new promClient.Registry();

// Initialize Pushgateway for spike alerts
const pushgateway = new Pushgateway('http://pushgateway:9091', [], register);
const jobName = 'express_app_alerts';

// Configuration for spike detection
const ACTIVE_REQUESTS_THRESHOLD = 30;  // 30 concurrent requests
const SPIKE_WINDOW_MS = 5000;         // 5 second window
const RATE_INCREASE_THRESHOLD = 1.5;  // 50% increase in rate

let lastPushTime = Date.now();
let requestsInWindow = 0;
let lastWindowRequests = 0;

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  prefix: 'app_',
  register
});

// Create metrics
export const httpActiveRequests = new promClient.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests',
  labelNames: ['method', 'route'],
  registers: [register]
});

export const httpRequestsCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Count of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Create alert metrics that will be pushed
const spikeAlert = new promClient.Gauge({
  name: 'http_request_spike_alert',
  help: 'Alert for sudden spikes in request rate',
  labelNames: ['severity', 'trigger_type'],
  registers: [register]
});

// Function to detect and push spikes
const detectAndPushSpike = async (activeRequests: number, method: string, route: string) => {
  const currentTime = Date.now();
  requestsInWindow++;

  // Check for spikes every SPIKE_WINDOW_MS
  if (currentTime - lastPushTime >= SPIKE_WINDOW_MS) {
    const requestRate = requestsInWindow / (SPIKE_WINDOW_MS / 1000);
    const previousRate = lastWindowRequests / (SPIKE_WINDOW_MS / 1000);
    const rateIncrease = previousRate > 0 ? requestRate / previousRate : 1;

    // Detect spikes based on different conditions
    let shouldPush = false;
    let triggerType = '';

    // Condition 1: Active requests threshold exceeded
    if (activeRequests > ACTIVE_REQUESTS_THRESHOLD) {
      shouldPush = true;
      triggerType = 'high_concurrent_requests';
      spikeAlert.set({ severity: 'high', trigger_type: triggerType }, activeRequests);
    }

    // Condition 2: Sudden rate increase
    if (rateIncrease > RATE_INCREASE_THRESHOLD) {
      shouldPush = true;
      triggerType = 'sudden_rate_increase';
      spikeAlert.set({ severity: 'medium', trigger_type: triggerType }, rateIncrease);
    }

    if (shouldPush) {
      try {
        // Push alert metrics to Pushgateway
        await pushgateway.push({ 
          jobName,
          groupings: {
            method,
            route,
            trigger_type: triggerType
          }
        });
        console.log(`Alert pushed: ${triggerType}`);
      } catch (error) {
        console.error('Error pushing alert metrics:', error);
      }
    }

    // Reset window counters
    lastWindowRequests = requestsInWindow;
    requestsInWindow = 0;
    lastPushTime = currentTime;
  }
};

export const prometheusMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const route = req.path;
  const method = req.method;

  // Increment active requests
  httpActiveRequests.inc({ method, route });
  
  // Get current active requests count
  const activeRequests = (await httpActiveRequests.get()).values[0]?.value;

  // Check for spikes
  detectAndPushSpike(activeRequests? activeRequests : 0, method, route);

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();

    // Update metrics
    httpRequestsCounter.inc({ method, route, status_code: statusCode });
    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    httpActiveRequests.dec({ method, route });
  });

  next();
};