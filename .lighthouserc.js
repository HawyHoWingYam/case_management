module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/login',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/cases',
      ],
      startServerCommand: 'npm run start:ci',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': 'off',
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        
        // Security
        'is-on-https': 'off', // For development
        'uses-https': 'off', // For development
        
        // Performance optimizations
        'unused-javascript': ['warn', { maxNumericValue: 200000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 50000 }],
        'modern-image-formats': 'warn',
        'offscreen-images': 'warn',
        'render-blocking-resources': 'warn',
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'efficient-animated-content': 'warn',
        'uses-optimized-images': 'warn',
        'uses-text-compression': 'warn',
        'uses-responsive-images': 'warn',
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'valid-lang': 'error',
        'meta-viewport': 'error',
        
        // Best practices
        'no-document-write': 'error',
        'external-anchors-use-rel-noopener': 'error',
        'no-vulnerable-libraries': 'error',
        'js-libraries': 'warn',
        'notification-on-start': 'warn',
        'password-inputs-can-be-pasted-into': 'error',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './reports/lighthouse',
    },
    server: {
      port: 9001,
      storage: './reports/lighthouse/server',
    },
  },
};