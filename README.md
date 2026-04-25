<div align="center">
  
# 🗺️ Map of Interest ✨

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![License: GPLv3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-1B222D?logo=prisma)](https://prisma.io)

**A collaborative web application for mapping, exploring, and sharing your favorite places!**

</div>

---

## 🚀 Features

* 📍 **Interactive Mapping:** Drop pins, save locations, get directions, and explore the map natively.
* 🤝 **Social Sharing:** Add friends natively and easily share your custom map pins with them.
* 💬 **Community Discussions:** Comment directly on shared places. All clones of a shared destination merge into one global conversation thread!
* 🛡️ **Robust Permissions:** Unilateral edit and delete controls. Only the original author of a place may adjust or wipe the pin out globally.
* 🔔 **Real-time Notifications:** Receive instant dashboard notifications when a friend accepts your request, shares a place, or leaves a new comment.
* 🎨 **Customization:** Categorize places with personalized color-coding and rich descriptions.
* 🔒 **Data Integrity:** Protected by strict database-level unique constraints preventing duplicates and ensuring clean data clones.

## 🛠 Tech Stack

* ⚛️ **Frontend Engine:** Next.js 15 (React), CSS Modules, Turbopack
* 🗄️ **Backend Database:** SQLite natively persisted on disk (`dev.db`)
* 🔗 **ORM:** Prisma Client
* 🔑 **Authentication:** Custom Cookie-based JWT mechanism

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

## 📄 License & Open Source

This project is generously **Dual-Licensed** to offer the maximum flexibility to the community!

You may choose to use, modify, and distribute this software under the terms of either:
- The permissive **[MIT License](LICENSE)** 
- The copyleft **[GNU General Public License v3.0 (GPLv3)](LICENSE)**

Please see the [`LICENSE`](LICENSE) file in the root directory for the complete official legal text. Contributions and forks are completely welcome!

---
<div align="center">
Welcome to Map of Interest! 🌍
</div>
