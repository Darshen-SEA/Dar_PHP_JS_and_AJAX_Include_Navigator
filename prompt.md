**Prompt for Developing an Improved Version of the Dar PHP, JS, AJAX, and CSS Include Navigator Extension**

**Objective**:
Create an enhanced Visual Studio Code extension, tentatively named "Dar PHP, JS, AJAX, and CSS Include Navigator," that improves upon the functionality of the "Dar PHP, JS, and AJAX Include Navigator" extension. The new extension should provide seamless navigation to PHP include files, JavaScript sources, CSS stylesheets, and AJAX URLs, with additional features for improved usability, performance, and developer experience, while maintaining compatibility with modern web development workflows.

**Requirements**:

1. **Core Functionality (Improved Navigation)**:
   - Retain the core feature of navigating to PHP include files (e.g., `include`, `require`, `include_once`, `require_once`), JavaScript sources (e.g., `import`, `require`, or `<script src>`), CSS stylesheets (e.g., `<link rel="stylesheet" href>`, CSS `@import`, JS/TS imports of `.css`), and AJAX URLs (e.g., URLs in `fetch`, `XMLHttpRequest`, or Axios calls) using **Ctrl+Click** (or equivalent for macOS, e.g., Cmd+Click).
   - Enhance navigation to support modern frameworks and libraries, such as:
     - PHP frameworks: Laravel, Symfony, CodeIgniter, etc., including navigation to files referenced in framework-specific routing or configuration (e.g., Laravel’s `routes/web.php` or controller classes).
     - JavaScript frameworks: React, Vue, Angular, Node.js, etc., supporting ES modules (`import/export`), CommonJS, and dynamic imports.
     - CSS scenarios:
       - HTML and templating: `<link rel="stylesheet" href="...">` in HTML, Blade, Twig, JSX/TSX (Head components), etc.
       - CSS/Preprocessor imports: `@import` and `@use` (CSS/SCSS/LESS), `@import url(...)`.
       - JS/TS to CSS: imports like `import './styles.css'` (Vite/Webpack/Rollup/Next.js), Angular `styleUrls`, Vue SFC `<style src>`, React/Next CSS Modules (e.g., `import styles from './Component.module.css'`).
       - Optional: navigate assets from CSS `url(...)` (images, fonts) if enabled.
     - AJAX/HTTP requests: Support modern libraries like Axios, Fetch API, and jQuery, with the ability to resolve URLs to API endpoints or local files when possible.
   - Add support for navigating to files or URLs defined in configuration files (e.g., `.env`, Webpack configs, or `package.json` scripts) and CSS-related configs (e.g., `postcss.config.*`, `tailwind.config.*`, `vite.config.*`, `angular.json` `styleUrls`, `next.config.*` for CSS Modules routes).
   - Respect bundler/alias resolution for styles (e.g., Webpack/Vite `resolve.alias`, `tsconfig`/`jsconfig` paths, `~` prefix in Webpack CSS imports).

2. **New Features**:
   - **Context-Aware Suggestions**: Provide IntelliSense-like suggestions for file paths or URLs when editing include/import statements, including:
     - PHP include/require paths, JS/TS import paths, CSS `@import` paths, HTML `<link href>` paths.
     - Respect workspace root, aliases, and framework conventions.
   - **Preview Window**: Implement a hover preview or quick peek feature to display the contents of the target file or URL without leaving the current editor. For CSS, show the top N lines and indicate if it’s a remote stylesheet.
   - **Multi-File Navigation**: Allow navigation to multiple possible targets (e.g., when an include could resolve to multiple files in a project) via a quick-pick menu. Applies to ambiguous CSS imports (e.g., `index.css` inside multiple style folders).
   - **URL Validation**: For AJAX and remote CSS URLs (e.g., `<link href="https://...">`, `@import url('https://...')`), validate whether the URL is accessible (e.g., using a lightweight HEAD request) and provide feedback if the endpoint is invalid or unreachable.
   - **Refactoring Support**: Integrate with VS Code’s refactoring tools to suggest extracting repeated includes/imports into reusable modules or configuration files (e.g., consolidate repeated stylesheet imports into a single entry point).
   - **Framework Detection**: Automatically detect the project’s framework (e.g., Laravel, React, Angular, Vue, Next.js, Tailwind) and adjust navigation logic to handle framework-specific conventions (e.g., resolving Laravel Blade templates, Vue components, Angular `styleUrls`, React/Next CSS Modules).
   - **Error Handling**: Provide meaningful error messages or diagnostics when a file or URL cannot be resolved (e.g., “File not found,” “Invalid URL format,” “Alias not found in bundler config”).

3. **Performance and Reliability**:
   - Optimize navigation performance by caching file and URL resolutions within the project scope to reduce disk I/O and network calls.
   - Use robust parsing mechanisms to accurately identify include/import statements and URLs, avoiding false positives:
     - TypeScript/ESTree for JS/TS (including CSS imports in JS).
     - PHP-Parser for PHP.
     - PostCSS (or CSSTree) for CSS and preprocessors (basic SCSS/LESS `@import/@use`), with graceful fallback for unparseable constructs.
     - HTML/templating analysis for `<link rel="stylesheet">` in HTML, Blade, Twig, JSX/TSX.
   - Ensure compatibility with large projects by implementing efficient indexing of files and dependencies, including a style index for `.css` (and optionally `.scss`, `.less`, `.pcss`).
   - Support case-sensitive and case-insensitive file systems (e.g., Linux vs. Windows).
   - Respect and cache alias maps from bundler configs to avoid repeated parsing.

4. **User Experience**:
   - Provide a configuration panel in VS Code’s settings to customize navigation behavior, such as:
     - Enabling/disabling specific language support (PHP, JS, CSS, AJAX).
     - Setting custom file extensions to recognize (e.g., `.php`, `.jsx`, `.ts`, `.css`, `.scss`, `.less`).
     - Configuring hover preview settings or navigation shortcuts.
     - CSS-specific options:
       - Enable navigation for `url(...)` assets inside CSS.
       - Prefer source mapping from generated CSS to original source when sourcemaps are present (optional).
       - Treat CSS Modules as first-class (resolve `.module.css` with higher priority when imported as a module).
   - Add a status bar indicator or command palette commands (e.g., “Navigate to Include”) for alternative ways to trigger navigation.
   - Include a comprehensive README with usage examples, screenshots, and troubleshooting tips, including CSS-focused examples (HTML `<link>`, CSS `@import`, JS-to-CSS import, CSS Modules).
   - Support internationalization (i18n) for UI elements to cater to a global audience.

5. **Testing and Quality Assurance**:
   - Implement automated unit tests using a framework like Jest or Mocha to verify navigation logic across PHP, JavaScript, CSS, and AJAX scenarios.
   - Set up integration tests within a VS Code testing environment (e.g., using `vscode-test`) to ensure compatibility with different VS Code versions.
   - Include tests for edge cases, such as:
     - Missing files, invalid URLs, alias not found.
     - Framework-specific conventions (Angular `styleUrls`, Vue `<style src>`, Next.js CSS Modules).
     - Multiple files matching the same import.
     - Remote CSS imports (`@import url('https://...')`) with validation feedback.
   - Use static analysis tools (e.g., ESLint for TypeScript/JavaScript, PHPStan for PHP) to ensure code quality.

6. **Development and Build**:
   - Write the extension in **TypeScript** to leverage VS Code’s extension API and ensure type safety.
   - Use modern build tools like Webpack or esbuild to bundle the extension for optimal performance.
   - Structure the codebase to be modular, with separate modules for PHP, JavaScript, CSS, and AJAX navigation logic.
   - Follow VS Code extension best practices, including proper use of the Language Server Protocol (LSP) for advanced language features. Implement DefinitionProvider, HoverProvider, and CompletionItemProvider hooks for cross-language CSS scenarios (HTML, CSS, JS/TS).

7. **Documentation and Community**:
   - Create detailed documentation covering installation, configuration, and usage, hosted on a dedicated GitHub repository.
   - Include a changelog to track updates and bug fixes.
   - Publish the extension on the Visual Studio Marketplace with a clear description, tags, and categories (e.g., “PHP,” “JavaScript,” “CSS,” “Navigation,” “Productivity”).

8. **Optional Advanced Features**:
   - **Visual Navigation Graph**: Create a visual representation of file and URL dependencies (e.g., using a `chartjs` chart in a VS Code webview) to help developers understand project structure, including CSS import graphs and asset relations (if `url(...)` navigation is enabled).
   - **Source Map Awareness for Styles**: When sourcemaps are present, enable navigation from generated CSS back to original preprocessor sources.
   - **Cross-Workspace Support**: Support multi-root workspaces and monorepos, resolving includes/imports across workspace folders with per-root alias maps.
   - **System: Language Detection > PHP > AJAX > JavaScript > CSS**