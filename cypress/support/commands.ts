/**
 * Custom Cypress commands for E2E testing
 * These commands provide reusable functionality across tests
 */

// Import command types
/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login command - authenticates user and stores token
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Logout command - clears authentication state
       */
      logout(): Chainable<void>;
      
      /**
       * Create case command - creates a new case through UI
       */
      createCase(caseData: {
        title: string;
        description: string;
        priority: string;
        clientId?: string;
      }): Chainable<void>;
      
      /**
       * Navigate to specific section
       */
      navigateTo(section: string): Chainable<void>;
      
      /**
       * Wait for API response
       */
      waitForApi(alias: string, timeout?: number): Chainable<void>;
      
      /**
       * Get element by data-cy attribute
       */
      getByCy(selector: string): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Tab navigation for accessibility testing
       */
      tab(options?: { shift?: boolean }): Chainable<void>;
      
      /**
       * Seed test data
       */
      seedTestData(): Chainable<void>;
      
      /**
       * Clean test data
       */
      cleanTestData(): Chainable<void>;
    }
  }
}

/**
 * Login command
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    // Intercept login API call
    cy.intercept('POST', '/api/auth/login').as('loginRequest');
    
    // Visit login page
    cy.visit('/login');
    
    // Fill in credentials
    cy.getByCy('email-input').type(email);
    cy.getByCy('password-input').type(password);
    
    // Submit form
    cy.getByCy('login-button').click();
    
    // Wait for login to complete
    cy.wait('@loginRequest').then((interception) => {
      expect(interception.response?.statusCode).to.equal(201);
    });
    
    // Verify we're redirected to dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify token is stored
    cy.window().its('localStorage').invoke('getItem', 'auth_token').should('exist');
  });
});

/**
 * Logout command
 */
Cypress.Commands.add('logout', () => {
  cy.getByCy('user-menu').click();
  cy.getByCy('logout-button').click();
  cy.getByCy('confirm-logout').click();
  
  // Verify redirect to login
  cy.url().should('include', '/login');
  
  // Verify token is removed
  cy.window().its('localStorage').invoke('getItem', 'auth_token').should('not.exist');
});

/**
 * Create case command
 */
Cypress.Commands.add('createCase', (caseData) => {
  // Intercept create case API call
  cy.intercept('POST', '/api/cases').as('createCaseRequest');
  
  // Navigate to create case page
  cy.navigateTo('create-case');
  
  // Fill in case details
  cy.getByCy('case-title-input').type(caseData.title);
  cy.getByCy('case-description-textarea').type(caseData.description);
  cy.getByCy('case-priority-select').select(caseData.priority);
  
  if (caseData.clientId) {
    cy.getByCy('case-client-select').select(caseData.clientId);
  }
  
  // Submit form
  cy.getByCy('create-case-button').click();
  
  // Wait for creation to complete
  cy.wait('@createCaseRequest').then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
  });
  
  // Verify success message
  cy.getByCy('success-message').should('contain', 'Case created successfully');
});

/**
 * Navigate to specific section
 */
Cypress.Commands.add('navigateTo', (section: string) => {
  const sectionMap: Record<string, string> = {
    'dashboard': '/dashboard',
    'cases': '/cases',
    'create-case': '/cases/create',
    'clients': '/clients',
    'profile': '/profile',
    'settings': '/settings',
    'reports': '/reports',
  };
  
  const path = sectionMap[section];
  if (!path) {
    throw new Error(`Unknown section: ${section}`);
  }
  
  cy.visit(path);
});

/**
 * Wait for API response with custom timeout
 */
Cypress.Commands.add('waitForApi', (alias: string, timeout = 10000) => {
  cy.wait(`@${alias}`, { timeout });
});

/**
 * Get element by data-cy attribute
 */
Cypress.Commands.add('getByCy', (selector: string) => {
  return cy.get(`[data-cy="${selector}"]`);
});

/**
 * Tab navigation for accessibility testing
 */
Cypress.Commands.add('tab', (options = {}) => {
  const key = options.shift ? '{shift}{tab}' : '{tab}';
  cy.focused().type(key);
});

/**
 * Seed test data
 */
Cypress.Commands.add('seedTestData', () => {
  cy.task('seedDatabase');
});

/**
 * Clean test data
 */
Cypress.Commands.add('cleanTestData', () => {
  cy.task('cleanDatabase');
});

// Custom assertions
Cypress.Commands.add('shouldBeAccessible', { prevSubject: 'element' }, (subject) => {
  // Check for basic accessibility attributes
  cy.wrap(subject).should('be.visible');
  
  // Check for ARIA attributes if it's an interactive element
  const tagName = subject.prop('tagName').toLowerCase();
  const interactiveElements = ['button', 'input', 'select', 'textarea', 'a'];
  
  if (interactiveElements.includes(tagName)) {
    cy.wrap(subject).should('satisfy', ($el) => {
      const hasAriaLabel = $el.attr('aria-label');
      const hasAriaLabelledby = $el.attr('aria-labelledby');
      const hasTitle = $el.attr('title');
      const hasTextContent = $el.text().trim();
      
      return hasAriaLabel || hasAriaLabelledby || hasTitle || hasTextContent;
    });
  }
});

// Performance monitoring
Cypress.Commands.add('measurePerformance', (name: string) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-start`);
  });
});

Cypress.Commands.add('endMeasurePerformance', (name: string) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-end`);
    win.performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = win.performance.getEntriesByName(name)[0];
    cy.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
    
    // Fail test if performance is too slow
    expect(measure.duration).to.be.lessThan(5000, `${name} took too long: ${measure.duration}ms`);
  });
});

// Visual regression testing helpers
Cypress.Commands.add('compareSnapshot', (name: string) => {
  // This would integrate with a visual regression testing tool
  // For now, just take a screenshot
  cy.screenshot(name, { 
    capture: 'viewport',
    blackout: ['.loading-spinner', '.timestamp'] // Hide dynamic content
  });
});

// API testing helpers
Cypress.Commands.add('apiRequest', (method: string, url: string, body?: any) => {
  return cy.request({
    method,
    url: `${Cypress.env('apiUrl')}${url}`,
    body,
    headers: {
      'Content-Type': 'application/json',
    },
    failOnStatusCode: false,
  });
});

// Database helpers
Cypress.Commands.add('queryDatabase', (query: string, params?: any[]) => {
  return cy.task('queryDatabase', { query, params });
});

// Mock API responses
Cypress.Commands.add('mockApiResponse', (method: string, url: string, response: any, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response,
  }).as(`mock${method}${url.replace(/\//g, '')}`);
});

// Error simulation
Cypress.Commands.add('simulateNetworkError', (url: string) => {
  cy.intercept('*', url, { forceNetworkError: true }).as('networkError');
});

Cypress.Commands.add('simulateServerError', (url: string, statusCode = 500) => {
  cy.intercept('*', url, {
    statusCode,
    body: { message: 'Internal Server Error' },
  }).as('serverError');
});

export {};