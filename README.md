# Boston 311 Dashboard

A React dashboard for exploring Boston 311 service requests: map, filters, and charts.

## Prerequisites

- **Node.js** 18+ and npm

## Download and run

1. **Clone or download the repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/311-app.git
   cd 311-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the dev server**
   ```bash
   npm run dev
   ```

4. Open the URL shown in the terminal (e.g. `http://localhost:5173`) in your browser.

## Large CSV warning

The app loads **`src/data/2026-311-data.csv`** (tens of thousands of rows). **The first load can take around a minute** to parse and render. The page may look blank or “Loading data…” until it finishes. This is normal for large datasets.

## Build for production

```bash
npm run build
npm run preview
```

`preview` serves the built app locally so you can test it before deploying.

## Data

311 case data is in `src/data/2026-311-data.csv`. The app uses it via a static import, so the file is bundled. To use a smaller sample, replace that file with a trimmed CSV (e.g. first 500 lines) for faster loads during development.
