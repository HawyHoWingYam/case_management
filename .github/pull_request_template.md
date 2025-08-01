# Pull Request Template

## 📋 PR Overview

### Summary
<!-- Provide a brief summary of the changes in this PR -->

### Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration change
- [ ] 🎨 Style/UI improvement
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security enhancement
- [ ] 🧪 Test improvements

### Related Issues
<!-- Link to related issues -->
Closes #[issue-number]
Related to #[issue-number]

---

## 🎯 Core Team Principles Compliance

### 1. Peer Review Model (同儕審查模式)
- [ ] **Code Quality**: Logic is correct and readable
- [ ] **Architecture**: Changes align with existing patterns and conventions
- [ ] **Performance**: No performance regressions introduced
- [ ] **Test Coverage**: Adequate test coverage provided (≥90%)
- [ ] **Documentation**: Code is self-documenting or includes necessary comments

### 2. Data-Driven Decisions (數據驅動決策)
- [ ] **Benchmarks**: Performance impacts measured (if applicable)
- [ ] **Metrics**: Relevant metrics collected to support design decisions
- [ ] **Evidence**: Claims supported by testing results or documentation
- [ ] **Alternatives**: Alternative approaches considered and documented

### 3. Definition of Done (完整流程的「完成」定義)
**Critical Checklist - ALL must be checked:**
- [ ] ✅ **Peer Review**: All review comments resolved
- [ ] ✅ **Tests Pass**: All CI tests passing (unit, integration, E2E)
- [ ] ✅ **Coverage**: Test coverage ≥90% maintained
- [ ] ✅ **Security**: No new high/medium vulnerabilities introduced
- [ ] ✅ **Documentation**: Updated (OpenAPI, README, ADRs if applicable)
- [ ] ✅ **WCAG Compliance**: Accessibility standards verified (for UI changes)
- [ ] ✅ **Staging Deploy**: Successfully deployed to staging (for main branch)

---

## 🔧 Technical Details

### Multi-Agent Responsibility
**Primary Agent**: <!-- Which agent type primarily worked on this? (spec-architect, database-specialist, api-developer, frontend-expert, product-manager, qa-engineer, devops-engineer, ui-ux-designer) -->

**Contributing Agents**: <!-- List other agents that contributed -->

### Implementation Details
<!-- Describe the implementation approach -->

#### Backend Changes (if applicable)
- [ ] API endpoints added/modified
- [ ] Database schema changes
- [ ] Business logic updates
- [ ] Error handling improvements
- [ ] Authentication/authorization changes

#### Frontend Changes (if applicable)
- [ ] New components created
- [ ] UI/UX improvements
- [ ] Responsive design verified
- [ ] Accessibility features added
- [ ] Performance optimizations

#### Database Changes (if applicable)
- [ ] Migration scripts included
- [ ] Indexes optimized
- [ ] Data integrity maintained
- [ ] Rollback strategy documented

#### Infrastructure Changes (if applicable)
- [ ] Docker configurations updated
- [ ] CI/CD pipeline changes
- [ ] Environment configurations
- [ ] Monitoring/logging enhancements

---

## 🧪 Testing Strategy

### Test Coverage
- **Unit Tests**: <!-- Coverage percentage and key areas tested -->
- **Integration Tests**: <!-- API endpoints/workflows tested -->
- **E2E Tests**: <!-- User workflows covered -->
- **Performance Tests**: <!-- Load/stress testing results if applicable -->

### Testing Checklist
- [ ] Unit tests written and passing
- [ ] Integration tests added for new APIs
- [ ] E2E tests cover critical user paths
- [ ] Manual testing completed
- [ ] Edge cases considered and tested
- [ ] Error scenarios tested
- [ ] Performance impact validated

### Browser/Device Testing (Frontend)
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile responsive (iOS/Android)
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility

---

## 🔒 Security Considerations

- [ ] **Input Validation**: All user inputs properly validated
- [ ] **SQL Injection**: Protected against SQL injection
- [ ] **XSS Protection**: Cross-site scripting vulnerabilities addressed
- [ ] **Authentication**: Authentication flows secure
- [ ] **Authorization**: Role-based access controls verified
- [ ] **Data Exposure**: No sensitive data exposed in logs/responses
- [ ] **Dependency Security**: No new vulnerable dependencies introduced

---

## 📊 Performance Impact

### Metrics (if applicable)
- **API Response Times**: <!-- Before/after measurements -->
- **Bundle Size**: <!-- Frontend bundle impact -->
- **Database Queries**: <!-- Query performance analysis -->
- **Memory Usage**: <!-- Memory impact assessment -->

### Performance Checklist
- [ ] No N+1 query problems introduced
- [ ] Appropriate caching implemented
- [ ] Database queries optimized
- [ ] Bundle size impact acceptable
- [ ] No memory leaks introduced

---

## 📱 Accessibility (WCAG 2.1 AA Compliance)

### Accessibility Checklist (Frontend Changes)
- [ ] **Semantic HTML**: Proper semantic elements used
- [ ] **ARIA Labels**: Appropriate ARIA labels and roles
- [ ] **Keyboard Navigation**: Full keyboard accessibility
- [ ] **Screen Reader**: Compatible with screen readers
- [ ] **Color Contrast**: Meets WCAG contrast requirements
- [ ] **Focus Management**: Logical focus order maintained
- [ ] **Alternative Text**: Images have appropriate alt text
- [ ] **Form Labels**: All form controls properly labeled

---

## 🚀 Deployment Considerations

### Deployment Strategy
- [ ] **Zero Downtime**: Changes support zero-downtime deployment
- [ ] **Feature Flags**: Feature flags used for gradual rollout (if applicable)
- [ ] **Rollback Plan**: Clear rollback strategy documented
- [ ] **Environment Variables**: New environment variables documented
- [ ] **Database Migrations**: Migrations are reversible and tested

### Post-Deployment Verification
- [ ] Health checks pass
- [ ] Key user workflows functional
- [ ] Monitoring/alerting configured
- [ ] Performance baselines maintained

---

## 📖 Documentation Updates

### Documentation Checklist
- [ ] **API Documentation**: OpenAPI/Swagger specs updated
- [ ] **Database Schema**: ERD or schema documentation updated
- [ ] **Architecture Decisions**: ADRs created for significant changes
- [ ] **User Documentation**: User-facing features documented
- [ ] **Developer Documentation**: Setup/development docs updated
- [ ] **Changelog**: CHANGELOG.md updated

---

## 🔄 n8n Workflow Integration

### Business Process Impact
- [ ] **New Case Notifications**: Workflow updates needed
- [ ] **Status Change Alerts**: Notification logic modified
- [ ] **Reporting Automation**: Reporting workflows affected
- [ ] **DevOps Notifications**: CI/CD notification changes
- [ ] **Error Alerting**: Error handling workflow updates

---

## ✅ Pre-Merge Checklist

**Reviewer Instructions**: Verify each item before approval

### Code Quality Review
- [ ] Code follows project conventions and style guidelines
- [ ] No code smells or anti-patterns introduced
- [ ] Error handling is appropriate and consistent
- [ ] Logging is adequate but not excessive
- [ ] Comments explain "why" not "what" where needed

### Architecture Review
- [ ] Changes align with overall system architecture
- [ ] No architectural debt introduced
- [ ] Proper separation of concerns maintained
- [ ] Dependencies are appropriate and minimal

### Security Review
- [ ] No hardcoded secrets or sensitive data
- [ ] Input validation and sanitization implemented
- [ ] Authorization checks in place
- [ ] No new attack vectors introduced

### Final Verification
- [ ] All CI/CD pipelines passing
- [ ] Staging deployment successful
- [ ] Manual testing completed by reviewer
- [ ] Performance impact acceptable
- [ ] Documentation complete and accurate

---

## 📝 Additional Notes

<!-- Any additional context, decisions, or considerations for reviewers -->

### Breaking Changes
<!-- If this is a breaking change, describe migration path -->

### Future Considerations
<!-- Any technical debt or future improvements identified -->

---

**Reviewer Checklist Summary:**
- [ ] All "Definition of Done" items checked ✅
- [ ] Code quality meets standards
- [ ] Security considerations addressed
- [ ] Performance impact acceptable
- [ ] Tests comprehensive and passing
- [ ] Documentation complete
- [ ] Ready for production deployment

**Final Review Decision:**
- [ ] ✅ **APPROVE** - Meets all quality standards and requirements
- [ ] 🔄 **REQUEST CHANGES** - Issues identified that must be addressed
- [ ] 💬 **COMMENT** - Feedback provided, but approval not blocked