# LaunchDB

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://launchdb.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](LICENSE)

LaunchDB is a professional and intuitive open-source directory website mapping over 120+ platforms, subreddits, and SaaS directories where founders can launch their software, acquire early adopters, and build high-quality SEO backlink profiles.

Live Website: **[https://launchdb.vercel.app/](https://launchdb.vercel.app/)**  
GitHub Codebase: **[https://github.com/theshubh77/launchdb](https://github.com/theshubh77/launchdb)**

---

## 🚀 Key Features

- **Real-time Data Sync**: Loads listings directly from the original [awesome-saas-directories](https://github.com/theshubh77/awesome-saas-directories) JSON source of truth, falling back automatically to a bundled JSON copy if the API is offline.
- **Instant Search & Filtering**: Index-based instant search and platform filtering chips (Web Directories, Reddit, X/Twitter, Facebook, GitHub) with real-time count badges.
- **Fast Performance & Lazy Loading**: Batched scroll pagination powered by `IntersectionObserver` keeps the page lightweight and fast.
- **Premium Dark UI**: Built with a sleek slate-charcoal design theme that is fully responsive, clean, and avoids generic AI-generated gradient slop.
- **Favicon Integration**: Displays website favicons fetched via Google's service, with a letter-based badge fallback for missing assets.
- **Pulsing Footer**: Center-aligned footer featuring a custom pulsing heart emoji ❤️ animation linking to Shubham Bhamare.
- **SEO & AIO/GEO Optimization**: Built-in dynamic JSON-LD structured schema (`ItemList` type) and a dedicated semantic FAQ layout for answer engines (AEO/GEO).

---

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Vanilla CSS (zero Tailwind CSS dependencies)
- **Icons**: Phosphor Icons (`@phosphor-icons/react`)
- **Deployment**: Vercel (configured for fully static exports)

---

## 💻 Local Development Setup

To clone and run LaunchDB locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/theshubh77/launchdb.git
   cd launchdb
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

4. **Build for production (Static Export)**:
   ```bash
   npm run build
   ```
   The static files will be exported to the `out` directory, which can be deployed directly to Vercel or any static host.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
