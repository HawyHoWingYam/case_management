import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authTrend = new Trend('auth_duration');
const apiTrend = new Trend('api_duration');

// Test configuration
export let options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 50 }, // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 }, // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    // Ramp down
    { duration: '2m', target: 0 }, // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    // Global thresholds
    'http_req_duration': ['p(95)<2000'], // 95% of requests should be below 2s
    'http_req_failed': ['rate<0.1'], // Error rate should be less than 10%
    'errors': ['rate<0.1'], // Custom error rate should be less than 10%
    
    // Specific endpoint thresholds
    'http_req_duration{name:auth}': ['p(95)<1000'], // Auth should be fast
    'http_req_duration{name:api}': ['p(95)<1500'], // API calls should be reasonable
    'http_req_duration{name:static}': ['p(95)<500'], // Static files should be very fast
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'TestPassword123!' },
  { email: 'test2@example.com', password: 'TestPassword123!' },
  { email: 'test3@example.com', password: 'TestPassword123!' },
];

export function setup() {
  console.log('Setting up load test...');
  console.log(`Backend URL: ${BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  
  // Health check
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'Backend is healthy': (r) => r.status === 200,
  });
  
  return { baseUrl: BASE_URL, frontendUrl: FRONTEND_URL };
}

export default function(data) {
  const { baseUrl, frontendUrl } = data;
  
  // Select random test user
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  // Test scenarios with different weights
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% - Authentication flow
    testAuthenticationFlow(baseUrl, user);
  } else if (scenario < 0.7) {
    // 30% - Case management operations
    testCaseOperations(baseUrl, user);
  } else if (scenario < 0.9) {
    // 20% - Dashboard and reporting
    testDashboardOperations(baseUrl, user);
  } else {
    // 10% - Static resources
    testStaticResources(frontendUrl);
  }
  
  sleep(Math.random() * 3 + 1); // Random think time between 1-4 seconds
}

function testAuthenticationFlow(baseUrl, user) {
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'auth' },
  };
  
  // Login request
  const loginStart = Date.now();
  const loginResponse = http.post(`${baseUrl}/auth/login`, loginPayload, params);
  const loginDuration = Date.now() - loginStart;
  
  authTrend.add(loginDuration);
  
  const loginSuccess = check(loginResponse, {
    'Login status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'Login response has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accessToken !== undefined;
      } catch {
        return false;
      }
    },
    'Login response time < 1000ms': (r) => loginDuration < 1000,
  });
  
  if (!loginSuccess) {
    errorRate.add(1);
    return;
  }
  
  // Extract token for subsequent requests
  let token;
  try {
    const loginBody = JSON.parse(loginResponse.body);
    token = loginBody.accessToken;
  } catch {
    errorRate.add(1);
    return;
  }
  
  // Profile request
  const profileParams = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    tags: { name: 'auth' },
  };
  
  const profileResponse = http.get(`${baseUrl}/auth/profile`, profileParams);
  
  check(profileResponse, {
    'Profile status is 200': (r) => r.status === 200,
    'Profile has user data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.email === user.email;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);
}

function testCaseOperations(baseUrl, user) {
  // First authenticate
  const token = authenticate(baseUrl, user);
  if (!token) {
    errorRate.add(1);
    return;
  }
  
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    tags: { name: 'api' },
  };
  
  // Get cases list
  const casesStart = Date.now();
  const casesResponse = http.get(`${baseUrl}/cases`, authHeaders);
  const casesDuration = Date.now() - casesStart;
  
  apiTrend.add(casesDuration);
  
  check(casesResponse, {
    'Cases list status is 200': (r) => r.status === 200,
    'Cases list is array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
    'Cases response time < 1500ms': (r) => casesDuration < 1500,
  }) || errorRate.add(1);
  
  // Create a new case (10% chance)
  if (Math.random() < 0.1) {
    const newCase = JSON.stringify({
      title: `Test Case ${Date.now()}`,
      description: 'Load test generated case',
      priority: 'medium',
      status: 'open',
    });
    
    const createResponse = http.post(`${baseUrl}/cases`, newCase, authHeaders);
    
    check(createResponse, {
      'Case creation status is 201': (r) => r.status === 201,
      'Created case has ID': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id !== undefined;
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);
  }
}

function testDashboardOperations(baseUrl, user) {
  const token = authenticate(baseUrl, user);
  if (!token) {
    errorRate.add(1);
    return;
  }
  
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    tags: { name: 'api' },
  };
  
  // Dashboard statistics
  const statsResponse = http.get(`${baseUrl}/dashboard/stats`, authHeaders);
  
  check(statsResponse, {
    'Dashboard stats status is 200': (r) => r.status === 200,
    'Stats response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body === 'object' && body !== null;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);
  
  // Recent activities
  const activitiesResponse = http.get(`${baseUrl}/dashboard/activities`, authHeaders);
  
  check(activitiesResponse, {
    'Activities status is 200': (r) => r.status === 200,
    'Activities is array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);
}

function testStaticResources(frontendUrl) {
  const staticFiles = [
    '/_next/static/css/app.css',
    '/_next/static/js/app.js',
    '/favicon.ico',
    '/manifest.json',
  ];
  
  const file = staticFiles[Math.floor(Math.random() * staticFiles.length)];
  
  const staticStart = Date.now();
  const staticResponse = http.get(`${frontendUrl}${file}`, {
    tags: { name: 'static' },
  });
  const staticDuration = Date.now() - staticStart;
  
  check(staticResponse, {
    'Static file status is 200': (r) => r.status === 200,
    'Static file response time < 500ms': (r) => staticDuration < 500,
  }) || errorRate.add(1);
}

function authenticate(baseUrl, user) {
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const loginResponse = http.post(`${baseUrl}/auth/login`, loginPayload, params);
  
  if (loginResponse.status !== 200 && loginResponse.status !== 201) {
    return null;
  }
  
  try {
    const loginBody = JSON.parse(loginResponse.body);
    return loginBody.accessToken;
  } catch {
    return null;
  }
}

export function teardown(data) {
  console.log('Load test completed.');
  console.log('Check the results for performance metrics and thresholds.');
}