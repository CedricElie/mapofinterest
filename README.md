# Map of Interest 🌍✨

A collaborative Next.js web application for mapping, exploring, and sharing your favorite places!

## 🚀 Features

* **Interactive Mapping:** Drop pins, save locations, get directions, and explore the map.
* **Social Sharing:** Add friends natively and easily share your custom map pins with them.
* **Community Discussions:** Comment directly on shared places. All participants join a single conversation thread linked to the original place!
* **Robust Permissions:** Centralized control. Only the original author of a place can edit or delete the primary record.
* **Real-time Notifications:** Receive instant dashboard notifications when a friend accepts your request, shares a place, or leaves a new comment.
* **Customization:** Categorize places with personalized color-coding and descriptions.
* **Data Integrity:** Optimized database architecture using many-to-many relationships to ensure zero data duplication and instant updates across all participants.

## 🛠 Tech Stack

* **Frontend Engine:** Next.js 15 (React), CSS Modules, Turbopack
* **Backend Database:** SQLite natively persisted on disk (`dev.db`)
* **ORM:** Prisma Client
* **Authentication:** Custom Cookie-based JWT mechanism

## ⚡ Running the Project Locally

Follow these instructions to spin up the local development server from scratch:

**1. Install all dependencies**
```bash
npm install
```

**2. Synchronize the Database**
Because this project utilizes Prisma and SQLite, you must initialize the database and compile the schema.
```bash
npx prisma db push
npx prisma generate
```

**3. Boot the Server**
Start the responsive hot-reloading Next.js dev server:
```bash
npm run dev
```

Open your browser to `http://localhost:3000` to begin mapping!

## 🧩 Branching & Collaboration

Code commits should trace the structure of the collaborative networking. Database migrations should always be generated consecutively after the database schema dynamically scales to ensure memory integrity.

Welcome to Map of Interest!
