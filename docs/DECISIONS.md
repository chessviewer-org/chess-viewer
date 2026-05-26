# Architectural Decision Records (ADR)

Records of key architectural and technical decisions.

---

## Table of Contents

- [Overview](#overview)
- [Decision Log](#decision-log)
- [Technology Choices](#technology-choices)
- [Architecture Decisions](#architecture-decisions)
- [Performance Decisions](#performance-decisions)
- [UX/UI Decisions](#uxui-decisions)
- [Security Decisions](#security-decisions)
- [Future Considerations](#future-considerations)

---

## Overview

### Purpose

This document serves as a historical record of architectural decisions, providing context for:

- Why certain technologies were chosen
- Trade-offs that were considered
- Alternative approaches that were rejected
- Lessons learned during development

### Decision Format

Each decision follows this structure:

- **Status:** Accepted / Rejected / Deprecated / Superseded
- **Context:** What problem are we solving?
- **Decision:** What did we decide?
- **Consequences:** What are the results (positive and negative)?
- **Alternatives:** What other options were considered?

---

## Decision Log

### ADR-001: Use React for UI Framework

**Date:** 2025-12-27  
**Status:** Accepted

#### Context

Need a modern, performant framework for building an interactive chess board application with complex state management.

#### Decision

Use React 18+ (built with React 19.x) as the primary UI framework.

#### Consequences

**Positive:**

- Large ecosystem and community support
- Excellent performance with hooks and memoization
- Strong TypeScript support (future-ready)
- Virtual DOM for efficient updates
- Rich developer tools

**Negative:**

- Learning curve for contributors unfamiliar with React
- Bundle size larger than vanilla JS
- Runtime overhead compared to compiled frameworks

#### Alternatives Considered

1. **Vue.js** - Rejected: Smaller ecosystem, team more familiar with React
2. **Svelte** - Rejected: Less mature ecosystem, harder to find contributors
3. **Vanilla JavaScript** - Rejected: Would require building own state management

---

### ADR-002: Use HTML5 Canvas for Board Rendering

**Date:** 2025-12-28  
**Status:** Accepted

#### Context

Need to render chess boards that can be exported as high-quality images up to 12,800×12,800px.

#### Decision

Use HTML5 Canvas API instead of DOM-based rendering (SVG or HTML elements).

#### Consequences

**Positive:**

- Direct pixel manipulation for exports
- Better performance for high-resolution rendering
- Easier image export (toBlob, toDataURL)
- GPU-accelerated drawing
- Consistent rendering across browsers

**Negative:**

- Less accessible than DOM-based solutions
- No built-in hover/click detection on pieces
- Requires manual state management for interactions
- Screen readers cannot directly access canvas content

**Mitigation:**

- Provide ARIA descriptions for board positions
- Use semantic HTML around canvas
- Future: Consider SVG option for accessibility

#### Alternatives Considered

1. **SVG** - Rejected: Harder to export as raster images, performance issues at high resolutions
2. **DOM (div-based)** - Rejected: Poor export quality, performance issues with large boards
3. **WebGL** - Rejected: Overkill for 2D chess board, browser compatibility concerns

---

### ADR-003: Zero-Backend Architecture

**Date:** 2025-12-28  
**Status:** Accepted

#### Context

Users need a ChessVision without concerns about data privacy or requiring internet connectivity.

#### Decision

Build a completely client-side application with no backend server.

#### Consequences

**Positive:**

- Complete user privacy - no data collection
- Works offline after initial load
- No hosting costs for backend
- Instant export (no server round-trip)
- No authentication/user management complexity
- Easy to deploy (static hosting)

**Negative:**

- Cannot share positions between devices without manual export
- No cloud storage for history/favorites
- Limited to browser storage capacity
- Cannot implement collaborative features
- No usage analytics (intentional)

**Mitigation:**

- Use localStorage for persistence
- Provide export/import functionality
- Clear documentation about data storage

#### Alternatives Considered

1. **Backend with Database** - Rejected: Privacy concerns, complexity, hosting costs
2. **Hybrid (Optional Backend)** - Rejected: Adds complexity, still requires maintenance
3. **Peer-to-Peer** - Deferred: Interesting for future, but complex to implement

---

### ADR-004: Use Tailwind CSS for Styling

**Date:** 2025-12-28  
**Status:** Accepted

#### Context

Need a scalable, maintainable styling solution that supports rapid UI development.

#### Decision

Use Tailwind CSS utility-first framework.

#### Consequences

**Positive:**

- Rapid UI development with utility classes
- Consistent design system
- Small production bundle (PurgeCSS)
- No CSS naming conflicts
- Dark mode support built-in
- Responsive design made easy

**Negative:**

- Learning curve for utility-first approach
- Verbose className attributes
- Custom designs require Tailwind configuration
- Harder to override styles in some cases

#### Alternatives Considered

1. **CSS Modules** - Rejected: More boilerplate, harder to maintain consistency
2. **Styled Components** - Rejected: Runtime overhead, larger bundle
3. **Vanilla CSS** - Rejected: Hard to maintain, no design system

---

### ADR-005: Client-Side FEN Parsing Only

**Date:** 2025-12-28  
**Status:** Accepted

#### Context

Need to validate and parse FEN notation for chess positions.

#### Decision

Implement FEN parsing entirely in JavaScript on the client side.

#### Consequences

**Positive:**

- No server dependency
- Instant validation feedback
- Works offline
- Easy to test and debug

**Negative:**

- Cannot leverage server-side chess engines
- Limited to FEN validation (no move validation)
- All parsing logic in bundle

**Trade-offs:**

- Simple FEN parsing is lightweight (~2KB)
- Full chess engine (chess.js) would add ~80KB
- Current approach prioritizes simplicity over chess rules validation

#### Alternatives Considered

1. **Use chess.js library** - Rejected: Too heavy for our needs, we only need FEN parsing
2. **Server-side validation** - Rejected: Conflicts with zero-backend architecture
3. **WebAssembly chess engine** - Deferred: Interesting for future, adds complexity

---

### ADR-006: No Database, Use LocalStorage

**Date:** 2025-12-29  
**Status:** Accepted

#### Context

Need to persist user preferences, history, and favorites across sessions.

#### Decision

Use browser localStorage API for all data persistence.

#### Consequences

**Positive:**

- No backend required
- Synchronous API (easier to use)
- Available in all modern browsers
- 5-10MB storage per domain
- Fast read/write operations

**Negative:**

- Data is device-specific (no sync)
- Limited to ~5MB total storage
- Can be cleared by user/browser
- Synchronous API blocks main thread (mitigated by small data size)
- No automatic backup

**Best Practices:**

- Limit history to 50 most recent positions
- Compress favorites if list grows large
- Provide export/import functionality
- Handle localStorage quota exceeded errors

#### Alternatives Considered

1. **IndexedDB** - Rejected: Overkill for simple key-value storage
2. **Cookies** - Rejected: Size limitations (4KB), sent with every request
3. **SessionStorage** - Rejected: Doesn't persist across browser sessions

---

### ADR-007: PNG and JPEG Export Only (v3.x)

**Date:** 2025-12-29  
**Status:** Accepted

#### Context

Users need to export chess diagrams in various formats for different use cases.

#### Decision

Support PNG and JPEG export formats initially, defer SVG to a future release.

#### Update (2026-05-06)

This ADR was partially superseded in implementation: SVG export is now available in Advanced FEN flows. Home-page export parity is still pending.

#### Consequences

**Positive:**

- Raster formats work everywhere
- Easy to implement with Canvas API
- Predictable file sizes
- Good quality at high resolutions
- JPEG provides size/quality trade-off

**Negative:**

- Not resolution-independent (SVG would be)
- Large file sizes at ultra-HD resolutions
- Cannot edit exported diagrams
- No text searchability in exports

**Rationale:**

- 90% of use cases covered by PNG/JPEG
- SVG export requires significant refactoring
- Canvas → PNG/JPEG is straightforward
- Can add SVG in future without breaking changes

#### Alternatives Considered

1. **SVG Only** - Rejected: Harder to implement, raster formats still needed
2. **PDF Export** - Deferred: Requires additional library, less common use case
3. **Multiple Formats at Once** - Deferred: Adds complexity to UI

---

### ADR-008: Piece Images from Lichess (SVG)

**Date:** 2025-12-28  
**Status:** Accepted

#### Context

Need high-quality chess piece images that scale well and are open-source.

#### Decision

Use SVG piece sets from Lichess, which are MIT-licensed.

#### Consequences

**Positive:**

- Excellent quality at any size
- Open-source (MIT license)
- Multiple style options (27+ sets)
- Small file sizes (~2-5KB per piece)
- Vector format scales perfectly
- Community-maintained and battle-tested

**Negative:**

- External dependency on Lichess design
- Need to bundle all piece sets
- SVG parsing overhead (minimal)

**Implementation:**

- Store SVG pieces in `/public/pieces/`
- Organize by piece set name
- Lazy load piece sets on demand
- Cache loaded images in memory

#### Alternatives Considered

1. **Custom PNG Pieces** - Rejected: Poor scaling, large file sizes
2. **Icon Fonts** - Rejected: Limited customization, accessibility issues
3. **Unicode Chess Symbols** - Rejected: Inconsistent rendering across browsers/OS

---

### ADR-009: Single-Page Application (No Routing)

**Date:** 2025-12-28  
**Status:** Accepted

#### Context

Application is focused on a single task: creating chess diagrams.

#### Decision

Build as a single-page application without client-side routing.

#### Consequences

**Positive:**

- Simpler architecture
- Faster load time (no route code splitting)
- Better user experience (no page reloads)
- Easier state management
- Smaller bundle size

**Negative:**

- No deep linking to specific boards/settings
- Cannot bookmark specific states
- Browser back button doesn't work as expected
- Harder to add multiple "pages" later

**Note:** Added basic static pages (About, Support) via separate HTML files.

#### Alternatives Considered

1. **React Router** - Rejected: Unnecessary for single-focused app
2. **Multi-page site** - Rejected: Worse UX, more complex state management
3. **Hash routing** - Rejected: Ugly URLs, still unnecessary complexity

---

### ADR-010: No Authentication System

**Date:** 2025-12-28  
**Status:** Accepted

#### Context

Zero-backend architecture means no user accounts or authentication.

#### Decision

Do not implement any authentication or user management system.

#### Consequences

**Positive:**

- Maximum privacy for users
- No password management
- No security vulnerabilities from auth
- Faster development
- Simpler architecture

**Negative:**

- Cannot sync across devices
- Cannot implement cloud features
- No user-specific analytics
- Cannot save server-side preferences

**Philosophy:**
This decision aligns with our privacy-first approach and keeps the application simple and focused.

#### Alternatives Considered

1. **OAuth (Google/GitHub)** - Rejected: Conflicts with privacy-first philosophy
2. **Anonymous IDs** - Rejected: Still tracking, requires backend
3. **Optional Auth** - Rejected: Adds complexity, most users wouldn't use it

---

### ADR-011: Vite as Build Tool

**Date:** 2025-12-28  
**Status:** Accepted

#### Context

Need a modern, fast build tool that works well with React.

#### Decision

Use Vite instead of Create React App or Webpack.

#### Consequences

**Positive:**

- Extremely fast HMR (Hot Module Replacement)
- Modern ES modules in development
- Optimized production builds
- Better developer experience
- Smaller config surface
- Built-in TypeScript support

**Negative:**

- Newer tool (less Stack Overflow solutions)
- Some plugins may not be available
- Learning curve if familiar with Webpack

#### Alternatives Considered

1. **Create React App** - Rejected: Slower, webpack-based, being deprecated
2. **Next.js** - Rejected: Overkill, includes SSR we don't need
3. **Webpack directly** - Rejected: Too much configuration

---

### ADR-012: No Analytics or Tracking

**Date:** 2025-12-28  
**Status:** Accepted

#### Context

Privacy-first approach requires decision on user analytics.

#### Decision

Do not implement any analytics, tracking, or telemetry.

#### Consequences

**Positive:**

- Complete user privacy
- No cookies/tracking consent needed
- Faster page load (no tracking scripts)
- No GDPR/CCPA compliance needed
- Builds trust with users

**Negative:**

- Cannot measure user behavior
- Cannot track feature usage
- Cannot identify bugs through error tracking
- Cannot optimize based on real usage data

**Trade-off:**
We prioritize user privacy over product metrics. Issues will be reported via GitHub, not discovered through analytics.

#### Alternatives Considered

1. **Privacy-focused analytics (Plausible)** - Rejected: Still tracking, still scripts
2. **Anonymized error tracking** - Rejected: Users should report errors manually
3. **Opt-in analytics** - Rejected: Adds complexity, most users would opt out

---

### ADR-013: Vercel for Hosting

**Date:** 2025-12-28  
**Status:** Accepted

#### Context

Need reliable, fast hosting for static site with global CDN.

#### Decision

Deploy to Vercel with automatic deployments from GitHub.

#### Consequences

**Positive:**

- Automatic deployments from Git
- Global CDN for fast load times
- Free for open-source projects
- Excellent DX (Developer Experience)
- Built-in preview deployments
- Zero configuration needed

**Negative:**

- Vendor lock-in (mitigated by static site)
- Limited customization vs. own server
- Subject to Vercel's terms of service

**Note:** Static site can be deployed anywhere if needed (Netlify, GitHub Pages, etc.)

#### Alternatives Considered

1. **Netlify** - Similar to Vercel, chosen Vercel for better Vite support
2. **GitHub Pages** - Rejected: Less flexible, no automatic builds
3. **Self-hosted** - Rejected: Unnecessary complexity for static site

---

### ADR-014: Mobile-First Responsive Design

**Date:** 2025-12-29  
**Status:** Accepted

#### Context

Users access application from various devices (desktop, tablet, mobile).

#### Decision

Use mobile-first responsive design approach with Tailwind breakpoints.

#### Consequences

**Positive:**

- Better mobile UX
- Progressive enhancement approach
- Smaller base CSS (mobile styles)
- Follows modern best practices
- Better performance on mobile

**Negative:**

- Desktop-first developers may find it less intuitive
- Requires thinking about mobile constraints first

**Implementation:**

```css
/* Mobile first (default) */
.board {
  width: 100%;
}

/* Tablet and up */
@media (min-width: 768px) {
  .board {
    width: 600px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .board {
    width: 800px;
  }
}
```

#### Alternatives Considered

1. **Desktop-first** - Rejected: Mobile users would get worse experience
2. **Separate mobile site** - Rejected: Harder to maintain, worse UX
3. **Mobile-only** - Rejected: Desktop users are significant portion

---

### ADR-015: Semantic Versioning

**Date:** 2025-12-28  
**Status:** Accepted

#### Context

Need clear versioning strategy for releases and changelog.

#### Decision

Follow Semantic Versioning (SemVer 2.0.0): MAJOR.MINOR.PATCH

**Rules:**

- **MAJOR:** Breaking changes, incompatible API changes
- **MINOR:** New features, backwards-compatible
- **PATCH:** Bug fixes, backwards-compatible

#### Consequences

**Positive:**

- Clear version meaning
- Users understand impact of updates
- Industry standard
- Works well with npm/package.json

**Negative:**

- Requires discipline to follow
- Can be subjective what counts as "breaking"

**Examples:**

- v1.0.0 → v2.0.0: Removed localStorage keys
- v2.0.0 → v2.1.0: Added download feature
- v2.1.0 → v2.1.1: Fixed export bug

#### Alternatives Considered

1. **Date-based versioning** - Rejected: Doesn't convey impact of changes
2. **Simple incrementing** - Rejected: No semantic meaning
3. **Custom scheme** - Rejected: Would confuse users

---

## Technology Choices

### Summary Table

| Technology     | Decision     | Status   | Version  |
| -------------- | ------------ | -------- | -------- |
| **Framework**  | React        | Accepted | 19.x     |
| **Build Tool** | Vite         | Accepted | 8.x      |
| **Styling**    | Tailwind CSS | Accepted | 4.x      |
| **Rendering**  | HTML5 Canvas | Accepted | Native   |
| **State**      | React Hooks  | Accepted | Built-in |
| **Storage**    | localStorage | Accepted | Native   |
| **Hosting**    | Vercel       | Accepted | —        |
| **Icons**      | Lucide React | Accepted | 1.x      |
| **Pieces**     | Lichess SVG  | Accepted | —        |

---

## Architecture Decisions

### Component Architecture

**Decision:** Atomic design pattern with clear separation of concerns.

**Structure:**

```
components/
├── board/        # Chess board rendering
├── controls/     # User interface controls
│   ├── atoms/    # Basic building blocks
│   ├── modals/   # Dialog components
│   └── ...
├── ui/           # Reusable UI components
└── layout/       # Page layout components
```

**Rationale:**

- Clear separation makes code easier to find
- Atomic components are highly reusable
- Follows React best practices
- Easy for new contributors to understand

---

### State Management

**Decision:** React Hooks only, no external state management library.

**Rationale:**

- Application state is relatively simple
- Context API sufficient for global state
- useState/useReducer handle local state well
- Avoids Redux/MobX complexity and bundle size

**See:** [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) for details

---

## Performance Decisions

### Optimization Strategy

**Decision:** Optimize for perceived performance and bundle size.

**Key Techniques:**

1. **React.memo** for expensive components
2. **useMemo/useCallback** for heavy calculations
3. **Lazy loading** for modals and non-critical features
4. **Code splitting** at route level (future)
5. **Image caching** for piece sets

**Target Metrics:**

- First Contentful Paint < 1s
- Time to Interactive < 3s
- Bundle size < 500KB gzipped

---

## UX/UI Decisions

### Design Philosophy

**Decision:** Minimalist, functional design prioritizing usability.

**Principles:**

1. **Clarity over cleverness** - UI should be obvious
2. **Consistency** - Similar actions look similar
3. **Feedback** - User always knows what's happening
4. **Forgiveness** - Easy to undo mistakes
5. **Accessibility** - WCAG 2.1 Level AA compliance

---

### Color Themes

**Decision:** Provide multiple board themes with user customization.

**Rationale:**

- Different users have different preferences
- Traditional chess colors may have low contrast
- Customization increases user engagement
- Themes are easy to implement and maintain

---

## Security Decisions

### No Backend = Minimal Attack Surface

**Decision:** Client-side only architecture eliminates most security concerns.

**Security Benefits:**

- No SQL injection
- No server-side vulnerabilities
- No authentication attacks
- No data breaches (no data collection)
- No DDoS targets

**Remaining Concerns:**

- XSS (mitigated by React's built-in protections)
- Dependency vulnerabilities (monitored via Dependabot)
- Client-side code tampering (acceptable for this use case)

---

### Dependency Security

**Decision:** Automated monitoring and updates via Dependabot.

**Process:**

1. Dependabot creates PRs for security updates
2. Review and test changes
3. Merge within 48 hours if critical
4. Document in CHANGELOG.md

---

## Future Considerations

### Decisions to Revisit

#### 1. SVG Export Parity

**Current:** SVG export exists in Advanced FEN flow  
**Future:** Expose SVG export in Home page flow as well  
**Rationale:** Keep export capabilities consistent across entry points

#### 2. Backend (Maybe v5.0+)

**Current:** Zero-backend  
**Future:** Optional backend for cloud sync  
**Rationale:** User requests for cross-device sync, but must remain optional

#### 3. Progressive Web App

**Current:** PWA manifest added in v4.0.0  
**Future:** Full offline support with service worker  
**Rationale:** Better mobile experience, offline functionality

#### 4. WebAssembly (Maybe v5.0+)

**Current:** JavaScript FEN parsing  
**Future:** WASM for better performance  
**Rationale:** Performance boost for complex operations

---

## Decision Review Process

### When to Review Decisions

- Major version updates (v5.0, v6.0)
- Significant user feedback
- Technology changes (React 20, new browser APIs)
- Performance issues
- Security concerns

### How to Propose Changes

1. Open GitHub Discussion with proposal
2. Reference existing ADR being challenged
3. Provide rationale and evidence
4. Discuss trade-offs with community
5. Update ADR if decision changes

---

## Lessons Learned

### What Went Well

1. **Zero-backend** - Users love the privacy
2. **Tailwind CSS** - Rapid UI development
3. **React Hooks** - Simple state management
4. **Canvas rendering** - Excellent export quality

### What Could Be Improved

1. **Canvas accessibility** - Need better screen reader support
2. **Bundle size** - Could be smaller with more optimization
3. **Testing** - Need more automated tests

### What We'd Do Differently

1. Consider SVG rendering from start for accessibility
2. Add automated testing earlier in development
3. Document decisions sooner (this file!)

---

## Contributing to Decisions

Want to propose a new decision or challenge an existing one?

1. **Read existing ADRs** to understand context
2. **Open a GitHub Discussion** with your proposal
3. **Provide evidence** and rationale
4. **Consider trade-offs** - no decision is perfect
5. **Be open to feedback** from maintainers and community

---

**Last Updated:** 2026-05-23  
**Applies To:** v5.5.3  
**Maintainer:** [@BilgeGates](https://github.com/BilgeGates)
