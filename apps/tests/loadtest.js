import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    spike_test: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: '30s', target: 500 },   // Normal load
        { duration: '30s', target: 5000 },  // Spike
        { duration: '1m', target: 50 },   // Maintain spike
        { duration: '30s', target: 5 },   // Scale down
      ],
    },
  },
};

export default function () {
  http.get('https://kanbantool.com/kanban-board');
  sleep(0.1);
}