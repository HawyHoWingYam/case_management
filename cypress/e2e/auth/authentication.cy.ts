describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.task('cleanDatabase');
    cy.task('seedDatabase');
    cy.visit('/');
  });

  describe('Login Process', () => {
    it('should successfully login with valid credentials', () => {
      // Visit login page
      cy.visit('/login');
      
      // Verify login form is displayed
      cy.get('[data-cy=login-form]').should('be.visible');
      cy.get('[data-cy=email-input]').should('be.visible');
      cy.get('[data-cy=password-input]').should('be.visible');
      cy.get('[data-cy=login-button]').should('be.visible');

      // Fill in credentials
      cy.get('[data-cy=email-input]').type(Cypress.env('testUserEmail'));
      cy.get('[data-cy=password-input]').type(Cypress.env('testUserPassword'));

      // Submit form
      cy.get('[data-cy=login-button]').click();

      // Verify successful login
      cy.url().should('eq', Cypress.config().baseUrl + '/dashboard');
      cy.get('[data-cy=user-menu]').should('contain', 'Test User');
      cy.get('[data-cy=user-role-badge]').should('contain', 'Clerk');

      // Verify token is stored
      cy.window().its('localStorage').invoke('getItem', 'auth-token').should('exist');
    });

    it('should display error for invalid credentials', () => {
      cy.visit('/login');

      // Enter invalid credentials
      cy.get('[data-cy=email-input]').type('invalid@example.com');
      cy.get('[data-cy=password-input]').type('wrongpassword');
      cy.get('[data-cy=login-button]').click();

      // Verify error message
      cy.get('[data-cy=error-message]')
        .should('be.visible')
        .and('contain', 'Invalid credentials');

      // Verify user stays on login page
      cy.url().should('include', '/login');
      cy.window().its('localStorage').invoke('getItem', 'auth-token').should('not.exist');
    });

    it('should validate required fields', () => {
      cy.visit('/login');

      // Try to submit empty form
      cy.get('[data-cy=login-button]').click();

      // Verify validation errors
      cy.get('[data-cy=email-error]').should('contain', 'Email is required');
      cy.get('[data-cy=password-error]').should('contain', 'Password is required');

      // Verify form doesn't submit
      cy.url().should('include', '/login');
    });

    it('should validate email format', () => {
      cy.visit('/login');

      // Enter invalid email format
      cy.get('[data-cy=email-input]').type('invalid-email');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').click();

      // Verify email format error
      cy.get('[data-cy=email-error]').should('contain', 'Please enter a valid email');
    });

    it('should handle network errors gracefully', () => {
      // Intercept login request to simulate network error
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true }).as('loginError');

      cy.visit('/login');
      cy.get('[data-cy=email-input]').type(Cypress.env('testUserEmail'));
      cy.get('[data-cy=password-input]').type(Cypress.env('testUserPassword'));
      cy.get('[data-cy=login-button]').click();

      cy.wait('@loginError');

      // Verify network error message
      cy.get('[data-cy=error-message]')
        .should('be.visible')
        .and('contain', 'Network error. Please try again.');
    });
  });

  describe('Logout Process', () => {
    beforeEach(() => {
      // Login first
      cy.login(Cypress.env('testUserEmail'), Cypress.env('testUserPassword'));
    });

    it('should successfully logout user', () => {
      cy.visit('/dashboard');

      // Click logout
      cy.get('[data-cy=user-menu]').click();
      cy.get('[data-cy=logout-button]').click();

      // Verify logout confirmation dialog
      cy.get('[data-cy=logout-dialog]').should('be.visible');
      cy.get('[data-cy=confirm-logout]').click();

      // Verify redirect to login page
      cy.url().should('include', '/login');

      // Verify token is removed
      cy.window().its('localStorage').invoke('getItem', 'auth-token').should('not.exist');

      // Verify user can't access protected routes
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should cancel logout when clicking cancel', () => {
      cy.visit('/dashboard');

      cy.get('[data-cy=user-menu]').click();
      cy.get('[data-cy=logout-button]').click();

      // Cancel logout
      cy.get('[data-cy=logout-dialog]').should('be.visible');
      cy.get('[data-cy=cancel-logout]').click();

      // Verify user stays logged in
      cy.get('[data-cy=logout-dialog]').should('not.exist');
      cy.url().should('include', '/dashboard');
      cy.window().its('localStorage').invoke('getItem', 'auth-token').should('exist');
    });
  });

  describe('Session Management', () => {
    it('should redirect to login when accessing protected route without authentication', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');

      cy.visit('/cases');
      cy.url().should('include', '/login');

      cy.visit('/profile');
      cy.url().should('include', '/login');
    });

    it('should maintain session across page refreshes', () => {
      cy.login(Cypress.env('testUserEmail'), Cypress.env('testUserPassword'));
      cy.visit('/dashboard');

      // Refresh page
      cy.reload();

      // Verify user stays logged in
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy=user-menu]').should('contain', 'Test User');
    });

    it('should handle expired tokens gracefully', () => {
      cy.login(Cypress.env('testUserEmail'), Cypress.env('testUserPassword'));
      
      // Set expired token
      cy.window().then((win) => {
        win.localStorage.setItem('auth-token', 'expired.jwt.token');
      });

      // Try to access protected route
      cy.visit('/dashboard');

      // Should redirect to login with appropriate message
      cy.url().should('include', '/login');
      cy.get('[data-cy=session-expired-message]')
        .should('be.visible')
        .and('contain', 'Your session has expired. Please log in again.');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should show appropriate navigation for Clerk role', () => {
      cy.login(Cypress.env('testUserEmail'), Cypress.env('testUserPassword'));
      cy.visit('/dashboard');

      // Verify clerk can see these menu items
      cy.get('[data-cy=nav-cases]').should('be.visible');
      cy.get('[data-cy=nav-create-case]').should('be.visible');
      cy.get('[data-cy=nav-profile]').should('be.visible');

      // Verify clerk cannot see admin functions
      cy.get('[data-cy=nav-assign-cases]').should('not.exist');
      cy.get('[data-cy=nav-reports]').should('not.exist');
    });

    it('should show appropriate navigation for Chair role', () => {
      cy.login(Cypress.env('chairEmail'), Cypress.env('chairPassword'));
      cy.visit('/dashboard');

      // Verify chair can see all menu items
      cy.get('[data-cy=nav-cases]').should('be.visible');
      cy.get('[data-cy=nav-create-case]').should('be.visible');
      cy.get('[data-cy=nav-assign-cases]').should('be.visible');
      cy.get('[data-cy=nav-reports]').should('be.visible');
      cy.get('[data-cy=nav-profile]').should('be.visible');
    });

    it('should show appropriate navigation for Caseworker role', () => {
      cy.login(Cypress.env('caseworkerEmail'), Cypress.env('caseworkerPassword'));
      cy.visit('/dashboard');

      // Verify caseworker can see relevant menu items
      cy.get('[data-cy=nav-cases]').should('be.visible');
      cy.get('[data-cy=nav-my-cases]').should('be.visible');
      cy.get('[data-cy=nav-profile]').should('be.visible');

      // Verify caseworker cannot see admin functions
      cy.get('[data-cy=nav-create-case]').should('not.exist');
      cy.get('[data-cy=nav-assign-cases]').should('not.exist');
      cy.get('[data-cy=nav-reports]').should('not.exist');
    });

    it('should prevent unauthorized access to protected routes', () => {
      // Try accessing chair-only route as clerk
      cy.login(Cypress.env('testUserEmail'), Cypress.env('testUserPassword'));
      cy.visit('/assign-cases');

      // Should redirect or show access denied
      cy.get('[data-cy=access-denied]')
        .should('be.visible')
        .and('contain', 'You do not have permission to access this page');
    });
  });

  describe('Password Security', () => {
    it('should enforce password visibility toggle', () => {
      cy.visit('/login');

      // Password should be hidden by default
      cy.get('[data-cy=password-input]').should('have.attr', 'type', 'password');

      // Click show password
      cy.get('[data-cy=toggle-password]').click();
      cy.get('[data-cy=password-input]').should('have.attr', 'type', 'text');

      // Click hide password
      cy.get('[data-cy=toggle-password]').click();
      cy.get('[data-cy=password-input]').should('have.attr', 'type', 'password');
    });

    it('should clear password field on failed login attempts', () => {
      cy.visit('/login');

      cy.get('[data-cy=email-input]').type('test@example.com');
      cy.get('[data-cy=password-input]').type('wrongpassword');
      cy.get('[data-cy=login-button]').click();

      // After failed login, password field should be cleared
      cy.get('[data-cy=password-input]').should('have.value', '');
      cy.get('[data-cy=email-input]').should('have.value', 'test@example.com');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.visit('/login');

      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'email-input');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'password-input');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'login-button');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/login');

      cy.get('[data-cy=login-form]').should('have.attr', 'aria-label', 'Login form');
      cy.get('[data-cy=email-input]').should('have.attr', 'aria-describedby');
      cy.get('[data-cy=password-input]').should('have.attr', 'aria-describedby');
    });

    it('should announce errors to screen readers', () => {
      cy.visit('/login');

      cy.get('[data-cy=login-button]').click();

      cy.get('[data-cy=email-error]')
        .should('have.attr', 'role', 'alert')
        .and('have.attr', 'aria-live', 'polite');

      cy.get('[data-cy=password-error]')
        .should('have.attr', 'role', 'alert')
        .and('have.attr', 'aria-live', 'polite');
    });
  });
});