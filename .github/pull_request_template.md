# Pull Request

## Description

<!-- Provide a clear and concise description of what this PR does -->

## Related Issues

<!-- Link to related issues using #issue_number -->

Fixes #
Closes #
Related to #

## Type of Change

<!-- Mark the relevant option with an [x] -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] UI/UX improvement
- [ ] Performance improvement
- [ ] Code refactoring (no functional changes)
- [ ] Test addition or update
- [ ] Configuration change
- [ ] New piece style or theme
- [ ] Dependency update
- [ ] Security fix

## What's Changed

<!-- List the main changes in bullet points -->

-
-
-

## Screenshots/Videos/Demos

<!-- If applicable, add visual demonstrations of the changes -->

### Before

<!-- Screenshot, GIF, or description of the old behavior -->

### After

<!-- Screenshot, GIF, or description of the new behavior -->

### Live Demo (if applicable)

<!-- Link to Vercel preview deployment or similar -->

## Testing

### Test Environment

- **Browser(s)**: Chrome 121, Firefox 122, Safari 17
- **OS**: Windows 11 / macOS Sonoma / Ubuntu 22.04
- **Device**: Desktop / Laptop / Tablet / Mobile
- **Screen Resolution**:

### Test Cases Executed

<!-- Mark completed test cases with [x] -->

- [ ] Basic functionality works as expected
- [ ] Edge cases handled correctly (empty FEN, invalid input, etc.)
- [ ] Works with different piece styles (Alpha, Merida, etc.)
- [ ] Works with different board themes
- [ ] Export functionality tested (PNG/JPEG at various sizes)
- [ ] Board flip and coordinate display tested
- [ ] Favorites and history tested (if applicable)
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] Keyboard navigation works correctly
- [ ] No console errors or warnings

### Manual Testing Steps

<!-- Provide step-by-step instructions for reviewers to test -->

1. Navigate to https://chess-vision-site.vercel.app
2.
3.
4. Verify that

### Test FEN Positions Used

<!-- List any specific FEN positions used for testing -->

```
Standard position: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
Edge case:
Custom position:
```

## Pre-Submission Checklist

<!-- Mark completed items with [x] -->

### Code Quality

- [ ] My code follows the project's ESLint and Prettier configuration
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have removed any `console.log()` or debugging statements
- [ ] My code has no ESLint errors or warnings
- [ ] I have used meaningful variable and function names
- [ ] I have avoided code duplication (DRY principle)

### Functionality

- [ ] My changes generate no new warnings or errors
- [ ] I have tested my changes across different browsers (Chrome, Firefox, Safari)
- [ ] I have tested on both desktop and mobile devices
- [ ] My changes work correctly with various FEN positions
- [ ] Board rendering is correct (pieces, colors, coordinates)
- [ ] Export functionality works properly (if modified)
- [ ] No performance regression (board renders smoothly, exports quickly)
- [ ] Memory leaks checked (no accumulating event listeners, proper cleanup)

### Documentation

- [ ] I have updated the README.md (if needed)
- [ ] I have updated relevant documentation files
- [ ] I have added JSDoc comments for new functions/components
- [ ] I have updated the CHANGELOG.md (if applicable)
- [ ] I have added inline comments for complex logic

### Dependencies

- [ ] I have not introduced unnecessary dependencies
- [ ] All new dependencies are MIT-compatible or similar open source
- [ ] `package.json` and `package-lock.json` are updated
- [ ] Bundle size impact is acceptable (check with `npm run build`)

### Git Hygiene

- [ ] My commits have clear, descriptive messages following Conventional Commits
- [ ] I have squashed unnecessary commits
- [ ] My branch is up-to-date with the base branch
- [ ] No merge conflicts exist

## Code Review Focus Areas

<!-- Specific areas you'd like reviewers to pay attention to -->

## Performance Impact

<!-- Describe any performance implications -->

- [ ] No performance impact
- [ ] Improves performance (describe below)
- [ ] Potential performance impact (describe below)

**Performance Metrics:**

<!-- If applicable, include before/after metrics -->

```
Board render time: X ms → Y ms
Export time (1200px): X ms → Y ms
Bundle size: X KB → Y KB
Memory usage: X MB → Y MB
```

**Details:**

## Accessibility

<!-- Describe accessibility considerations -->

- [ ] This change maintains or improves accessibility
- [ ] All interactive elements are keyboard accessible (Tab, Enter, Arrow keys)
- [ ] Proper ARIA labels added where needed
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader tested (if UI changes)
- [ ] Focus indicators are visible

**Accessibility Notes:**

## Browser & Device Compatibility

<!-- Mark all browsers/devices you've tested on -->

### Desktop Browsers

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

### Mobile Browsers

- [ ] Mobile Safari (iOS 16+)
- [ ] Mobile Chrome (Android)

### Device Types

- [ ] Desktop (1920×1080+)
- [ ] Laptop (1366×768)
- [ ] Tablet (768×1024)
- [ ] Mobile (375×667)

**Compatibility Notes:**

## UI/UX Changes

<!-- If this PR includes UI changes -->

### Design Consistency

- [ ] Follows existing design patterns and component library
- [ ] Colors match the theme system
- [ ] Typography is consistent
- [ ] Spacing and layout follow Tailwind conventions
- [ ] Icons are from Lucide React library
- [ ] Animations are smooth and purposeful

### Responsive Behavior

<!-- Describe how UI adapts to different screen sizes -->

## Breaking Changes

<!-- If this PR includes breaking changes, describe them clearly -->

**Breaking Changes:**

<!-- Delete this section if not applicable -->

-
- **Migration Guide:**

<!-- How users should update their usage -->

1.
2.

## Known Issues / Limitations

<!-- List any known issues or limitations -->

-
-

## Security Considerations

<!-- Any security-related changes or considerations -->

- [ ] No security concerns
- [ ] Security improvement (describe below)
- [ ] Potential security impact (describe below)

**Details:**

## 📝 Additional Context

<!-- Any additional information reviewers should know -->

## Questions for Reviewers

<!-- Specific questions or areas where you need input -->

1.
2.

## Deployment Notes

<!-- Any special considerations for deployment -->

- [ ] No special deployment steps needed
- [ ] Requires environment variable changes (list below)
- [ ] Requires Vercel configuration update

**Deployment Steps:**

---

## Reviewer Guidelines

When reviewing this PR, please verify:

### Code Quality (⭐ Critical)

- [ ] Code is clean, readable, and maintainable
- [ ] Follows React and JavaScript best practices
- [ ] Proper use of React hooks (no unnecessary re-renders)
- [ ] Components are properly memoized where needed
- [ ] No prop drilling or context abuse

### Functionality (⭐ Critical)

- [ ] Works as described in all scenarios
- [ ] Handles edge cases gracefully
- [ ] No console errors or warnings
- [ ] Proper error handling and user feedback

### Chess-Specific (⭐ Critical for chess features)

- [ ] FEN parsing/validation is correct
- [ ] Board rendering is accurate
- [ ] Piece placement follows chess rules
- [ ] Coordinates and notation are correct

### Performance

- [ ] No unnecessary re-renders (use React DevTools Profiler)
- [ ] Images are optimized and lazy-loaded where appropriate
- [ ] Canvas operations are efficient
- [ ] Bundle size impact is minimal

### UI/UX

- [ ] Intuitive and user-friendly
- [ ] Consistent with existing design
- [ ] Responsive across all screen sizes
- [ ] Accessible (keyboard navigation, ARIA labels)

### Testing

- [ ] Adequate test coverage
- [ ] Edge cases are tested
- [ ] Manual testing confirms functionality

### Documentation

- [ ] Code comments explain "why", not just "what"
- [ ] Complex algorithms are well-documented
- [ ] Public APIs have JSDoc comments

---

## Commit Message Format

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**

```
feat(export): add SVG export format support
fix(board): resolve piece rendering issue in Safari
docs(readme): update installation instructions
perf(canvas): optimize board rendering performance
```

---

**By submitting this PR, I confirm that:**

- [ ] I have read and understood the [Contributing Guidelines](../CONTRIBUTING.md)
- [ ] My code follows the project's code style and conventions
- [ ] My contribution is licensed under the MIT License
- [ ] I agree to follow the [Code of Conduct](../CODE_OF_CONDUCT.md)
- [ ] I have tested my changes thoroughly
- [ ] This PR is ready for review (not a draft)
