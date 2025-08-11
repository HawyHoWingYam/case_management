/**
 * Case Detail Edit Component Integration Test
 * 
 * This file demonstrates how to test the case modification functionality:
 * 1. ADMIN/MANAGER permission checks
 * 2. Case status validation (OPEN/PENDING only)
 * 3. Form validation and submission
 * 4. Automatic logging and notifications
 * 5. File attachment handling
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CaseDetailEdit } from '@/components/cases/CaseDetailEdit'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

// Mock the auth store
jest.mock('@/stores/authStore')
jest.mock('@/lib/api')

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
const mockApi = api as jest.Mocked<typeof api>

describe('CaseDetailEdit Component', () => {
  const mockCaseData = {
    id: 1,
    title: '测试案件',
    description: '测试描述',
    status: 'OPEN',
    priority: 'MEDIUM',
    created_by_id: 1,
    assigned_to_id: null,
    created_at: '2025-08-11T10:00:00.000Z',
    updated_at: '2025-08-11T10:00:00.000Z',
    due_date: '2025-08-15T18:00:00.000Z',
    metadata: {
      attachments: []
    },
    created_by: {
      user_id: 1,
      username: 'creator',
      email: 'creator@example.com'
    }
  }

  const mockOnCaseUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render edit component for ADMIN user with OPEN case', () => {
    mockUseAuthStore.mockReturnValue({
      user: { user_id: 2, username: 'admin', email: 'admin@example.com', role: 'ADMIN' },
      hasRole: jest.fn().mockImplementation((roles) => roles.includes('ADMIN')),
      // ... other auth store properties
    } as any)

    render(
      <CaseDetailEdit
        caseData={mockCaseData}
        onCaseUpdate={mockOnCaseUpdate}
      />
    )

    // Should show the edit button
    expect(screen.getByText('编辑案件详情')).toBeInTheDocument()
    expect(screen.getByText('案件详情编辑')).toBeInTheDocument()
  })

  test('should render edit component for MANAGER user with PENDING case', () => {
    const pendingCaseData = { ...mockCaseData, status: 'PENDING' }
    
    mockUseAuthStore.mockReturnValue({
      user: { user_id: 3, username: 'manager', email: 'manager@example.com', role: 'MANAGER' },
      hasRole: jest.fn().mockImplementation((roles) => roles.includes('MANAGER')),
    } as any)

    render(
      <CaseDetailEdit
        caseData={pendingCaseData}
        onCaseUpdate={mockOnCaseUpdate}
      />
    )

    expect(screen.getByText('编辑案件详情')).toBeInTheDocument()
  })

  test('should not render for USER role', () => {
    mockUseAuthStore.mockReturnValue({
      user: { user_id: 4, username: 'user', email: 'user@example.com', role: 'USER' },
      hasRole: jest.fn().mockImplementation((roles) => roles.includes('USER')),
    } as any)

    const { container } = render(
      <CaseDetailEdit
        caseData={mockCaseData}
        onCaseUpdate={mockOnCaseUpdate}
      />
    )

    // Should not render anything
    expect(container.firstChild).toBeNull()
  })

  test('should not render for IN_PROGRESS case status', () => {
    const inProgressCaseData = { ...mockCaseData, status: 'IN_PROGRESS' }
    
    mockUseAuthStore.mockReturnValue({
      user: { user_id: 2, username: 'admin', email: 'admin@example.com', role: 'ADMIN' },
      hasRole: jest.fn().mockImplementation((roles) => roles.includes('ADMIN')),
    } as any)

    const { container } = render(
      <CaseDetailEdit
        caseData={inProgressCaseData}
        onCaseUpdate={mockOnCaseUpdate}
      />
    )

    // Should not render anything because status is not OPEN or PENDING
    expect(container.firstChild).toBeNull()
  })

  test('should handle form submission and call API', async () => {
    mockUseAuthStore.mockReturnValue({
      user: { user_id: 2, username: 'admin', email: 'admin@example.com', role: 'ADMIN' },
      hasRole: jest.fn().mockImplementation((roles) => roles.includes('ADMIN')),
    } as any)

    mockApi.cases.update.mockResolvedValue({
      data: { ...mockCaseData, title: '更新后的标题', updated_at: new Date().toISOString() }
    } as any)

    render(
      <CaseDetailEdit
        caseData={mockCaseData}
        onCaseUpdate={mockOnCaseUpdate}
      />
    )

    // Open the edit dialog
    fireEvent.click(screen.getByText('编辑案件详情'))

    // Wait for dialog to open and form to be ready
    await waitFor(() => {
      expect(screen.getByDisplayValue('测试案件')).toBeInTheDocument()
    })

    // Update the title
    const titleInput = screen.getByDisplayValue('测试案件')
    fireEvent.change(titleInput, { target: { value: '更新后的标题' } })

    // Submit the form
    fireEvent.click(screen.getByText('保存修改'))

    // Verify API was called
    await waitFor(() => {
      expect(mockApi.cases.update).toHaveBeenCalledWith(1, {
        title: '更新后的标题',
        description: '测试描述',
        priority: 'MEDIUM',
        due_date: expect.any(String),
        metadata: {
          attachments: []
        }
      })
    })

    // Verify callback was called
    await waitFor(() => {
      expect(mockOnCaseUpdate).toHaveBeenCalled()
    })
  })
})

/**
 * Manual Testing Steps:
 * 
 * 1. Login as ADMIN or MANAGER user
 * 2. Navigate to a case with status OPEN or PENDING
 * 3. Verify the "案件详情编辑" card appears
 * 4. Click "编辑案件详情" button
 * 5. Verify the edit dialog opens with pre-filled values
 * 6. Modify case details (title, description, priority, due date)
 * 7. Upload/manage file attachments
 * 8. Click "保存修改"
 * 9. Verify success toast appears
 * 10. Verify case data updates on the page
 * 11. Check case logs for automatic modification entry
 * 12. Check email notifications were sent to relevant users
 * 
 * Expected Behavior:
 * - Only ADMIN/MANAGER can access edit functionality
 * - Only cases in OPEN/PENDING status can be edited
 * - All changes are automatically logged with readable field names
 * - Email notifications sent to admin, managers, and assigned users
 * - File attachments are properly handled
 * - Form validation prevents invalid data submission
 */