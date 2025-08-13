# Dar PHP, JS, AJAX, and CSS Include Navigator

Navigate to PHP includes, JS/TS imports, CSS stylesheets, and AJAX URLs with Ctrl/Cmd+Click, hover previews, and smart completions.

## Features

- Ctrl/Cmd+Click to open targets from:
  - PHP: `include`, `require`, `include_once`, `require_once`
  - JS/TS: `import`, `require`, dynamic `import()`
  - HTML: `<script src>` and `<link rel="stylesheet" href>`
  - CSS: `@import`, `@use` (basic)
  - AJAX: `fetch()`, `XMLHttpRequest`, Axios (basic URL detection)
- Hover preview for local files and URL validation for remote links.
- Path completion suggestions within import/include strings.
- Multi-match support (multiple definitions are shown in Peek).
- Basic alias support via `tsconfig.json/jsconfig.json` `compilerOptions.paths`.

## Settings

See `package.json` contributes.configuration for all options. Highlights:
- `darNavigator.enablePHP` | `enableJS` | `enableCSS` | `enableHTML`
- `darNavigator.hover.preview` + `darNavigator.hover.maxLines`
- `darNavigator.url.validation`
- `darNavigator.preferCssModules`

## Commands

- `Include Navigator: Navigate to Include/Import` (darNavigator.navigateToInclude)

## Requirements

No special requirements. Works in single and multi-root workspaces.

## Known Limitations (v0.1.0)

- Framework-specific resolution (Laravel routes, Angular styleUrls, Vue SFC `<style src>`) is minimal.
- Bundler alias parsing (Webpack/Vite) is limited to TS/JS config `paths`.
- CSS `url(...)` assets navigation is optional and basic.

## Roadmap

- Deeper framework detection and routing resolution
- PostCSS/SCSS/LESS parsing improvements
- Visual navigation graph
- Source map awareness for styles

## Development

- Build: `npm run build`
- Watch: `npm run watch`
- Test: `npm test`
- Package: `npm run package`

