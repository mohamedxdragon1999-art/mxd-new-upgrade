# How to open the MXD Word Search site

1. Open the project folder on your machine (the directory that contains `index.html`).
2. Start a **local HTTP server** from that folder (not by double‑clicking `index.html`).

   Examples:

   ```bash
   npx serve .
   ```

   Or, if you prefer Python:

   ```bash
   python -m http.server 8080
   ```

3. In your browser, open the app URL. For `serve`, the terminal usually prints something like `http://localhost:3000` — then open `http://localhost:3000/index.html` (or the root URL if it already serves `index.html`). For Python on port 8080, use `http://localhost:8080/index.html`.

## Why not open `file://` directly?

This app loads **React and Babel from CDNs** and uses **in-browser JSX** (`type="text/babel"`). Many browsers block or mishandle ES modules, fetches, and script behavior when pages are opened as raw `file://` URLs. A local server gives a normal **http://** origin so scripts load and run reliably.
