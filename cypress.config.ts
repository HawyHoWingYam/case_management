import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    env: {
      apiUrl: 'http://localhost:3001/api',
      testUserEmail: 'clerk@example.com',
      testUserPassword: 'password123',
      chairEmail: 'chair@example.com',
      chairPassword: 'password123',
      caseworkerEmail: 'caseworker@example.com',
      caseworkerPassword: 'password123',
    },

    setupNodeEvents(on, config) {
      // Import database tasks
      const { seedDatabase, cleanDatabase, createTestUser } = require('./cypress/support/database-tasks');

      // Database and test data tasks
      on('task', {
        seedDatabase,
        cleanDatabase,
        createTestUser,

        log(message) {
          console.log(message);
          return null;
        },

        // File system tasks
        readFileMaybe(filename) {
          const fs = require('fs');
          const path = require('path');
          try {
            return fs.readFileSync(path.resolve(filename), 'utf8');
          } catch (error) {
            return null;
          }
        },

        // API tasks
        async makeApiRequest({ method, url, headers = {}, body = null }) {
          const axios = require('axios');
          try {
            const response = await axios({
              method,
              url: `${config.env.apiUrl}${url}`,
              headers,
              data: body,
            });
            return response.data;
          } catch (error) {
            throw new Error(`API request failed: ${error.message}`);
          }
        },
      });

      // Code coverage
      require('@cypress/code-coverage/task')(on, config);
      
      // Plugins
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          // Add Chrome flags for better testing
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--disable-extensions');
          launchOptions.args.push('--no-sandbox');
        }
        return launchOptions;
      });
      
      return config;
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
});