/**
 * Client test fixtures
 */

export const clientFixtures = {
  // Individual adult client
  individual: {
    id: '223e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St, City, State 12345',
    dateOfBirth: '1990-01-01',
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+1234567891',
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },

  // Family with children client
  family: {
    id: '223e4567-e89b-12d3-a456-426614174001',
    firstName: 'Mary',
    lastName: 'Johnson',
    email: 'mary.johnson@example.com',
    phone: '+1234567892',
    address: '456 Oak Ave, City, State 12345',
    dateOfBirth: '1985-05-15',
    emergencyContact: {
      name: 'Robert Johnson',
      relationship: 'Husband',
      phone: '+1234567893',
    },
    familyMembers: [
      {
        name: 'Sarah Johnson',
        relationship: 'Daughter',
        dateOfBirth: '2015-03-10',
      },
      {
        name: 'Michael Johnson',
        relationship: 'Son',
        dateOfBirth: '2018-07-22',
      },
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },

  // Elderly client
  elderly: {
    id: '223e4567-e89b-12d3-a456-426614174002',
    firstName: 'Robert',
    lastName: 'Wilson',
    email: 'robert.wilson@example.com',
    phone: '+1234567894',
    address: '789 Pine St, City, State 12345',
    dateOfBirth: '1945-09-30',
    emergencyContact: {
      name: 'Susan Wilson',
      relationship: 'Daughter',
      phone: '+1234567895',
    },
    medicalConditions: ['Diabetes', 'Hypertension'],
    mobility: 'Limited',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },

  // Young adult client
  youngAdult: {
    id: '223e4567-e89b-12d3-a456-426614174003',
    firstName: 'Alice',
    lastName: 'Brown',
    email: 'alice.brown@example.com',
    phone: '+1234567896',
    address: '321 Elm St, City, State 12345',
    dateOfBirth: '2003-12-10',
    emergencyContact: {
      name: 'Patricia Brown',
      relationship: 'Mother',
      phone: '+1234567897',
    },
    education: 'High School Graduate',
    employment: 'Part-time student',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },

  // Client with minimal information
  minimal: {
    id: '223e4567-e89b-12d3-a456-426614174004',
    firstName: 'Min',
    lastName: 'Client',
    email: null,
    phone: '+1234567898',
    address: 'Unknown',
    dateOfBirth: '1990-01-01',
    emergencyContact: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },

  // Client with complex needs
  complexNeeds: {
    id: '223e4567-e89b-12d3-a456-426614174005',
    firstName: 'Complex',
    lastName: 'Case',
    email: 'complex.case@example.com',
    phone: '+1234567899',
    address: '555 Complex St, City, State 12345',
    dateOfBirth: '1980-01-01',
    emergencyContact: {
      name: 'Emergency Contact',
      relationship: 'Friend',
      phone: '+1234567800',
    },
    medicalConditions: ['Depression', 'Anxiety', 'Chronic Pain'],
    disabilities: ['Physical', 'Cognitive'],
    languages: ['English', 'Spanish'],
    culturalBackground: 'Hispanic/Latino',
    housing: 'Temporary shelter',
    income: 'Disability benefits',
    insurance: 'Medicaid',
    legalIssues: ['Custody dispute', 'Immigration status'],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
};

// Helper function to create client with custom properties
export const createClientFixture = (overrides: Partial<typeof clientFixtures.individual> = {}) => ({
  ...clientFixtures.individual,
  ...overrides,
});

// Helper function to create multiple clients
export const createClientsFixture = (count: number, baseClient = clientFixtures.individual) => {
  return Array.from({ length: count }, (_, index) => ({
    ...baseClient,
    id: `${baseClient.id.slice(0, -3)}${String(index).padStart(3, '0')}`,
    firstName: `Client${index}`,
    lastName: `Test${index}`,
    email: `client${index}@example.com`,
    phone: `+123456789${index}`,
  }));
};

// Client form data for testing
export const clientFormData = {
  valid: {
    firstName: 'New',
    lastName: 'Client',
    email: 'new.client@example.com',
    phone: '+1234567890',
    address: '123 New St, City, State 12345',
    dateOfBirth: '1990-01-01',
  },

  invalid: {
    firstName: '', // Required field empty
    lastName: '', // Required field empty
    email: 'invalid-email', // Invalid email format
    phone: '123', // Invalid phone format
    address: '',
    dateOfBirth: 'invalid-date',
  },

  minimal: {
    firstName: 'Min',
    lastName: 'Client',
    phone: '+1234567890',
    dateOfBirth: '1990-01-01',
  },

  withEmergencyContact: {
    firstName: 'Client',
    lastName: 'WithContact',
    email: 'client.contact@example.com',
    phone: '+1234567890',
    address: '123 Contact St, City, State 12345',
    dateOfBirth: '1990-01-01',
    emergencyContact: {
      name: 'Emergency Person',
      relationship: 'Friend',
      phone: '+1234567891',
    },
  },

  withLongData: {
    firstName: 'A'.repeat(100), // Test max length validation
    lastName: 'B'.repeat(100),
    email: 'test@example.com',
    phone: '+1234567890',
    address: 'C'.repeat(500),
    dateOfBirth: '1990-01-01',
  },
};

// Client search criteria for testing
export const clientSearchCriteria = {
  byName: {
    search: 'John Doe',
  },
  byEmail: {
    email: 'john.doe@example.com',
  },
  byPhone: {
    phone: '+1234567890',
  },
  byAddress: {
    address: 'Main St',
  },
  byDateOfBirth: {
    dateOfBirth: '1990-01-01',
  },
};