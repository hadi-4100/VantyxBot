<div align="center">
  <img src="assets/logo.png" width="150" style="border-radius: 50%;" alt="Vantyx Logo" />
  <br />
  <h1>🌌 VantyxBot System</h1>
  <h3>The Next-Generation Discord Ecosystem</h3>
  
  <p>
    <a href="https://discord.gg/4EbSFSJZqH"><img src="https://img.shields.io/discord/614048301674921985?color=5865F2&logo=discord&logoColor=white&label=Community" alt="Discord Server" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white" alt="Node.js" /></a>
    <a href="https://github.com/hadi-4100/VantyxBot/blob/main/LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-green" alt="License" /></a>
    <a href="https://patreon.com/hadi4100"><img src="https://img.shields.io/badge/Sponsor-Patreon-orange?logo=patreon&logoColor=white" alt="Sponsor" /></a>
  </p>

  <p align="center">
    <strong>Vantyx</strong> is now <strong>Open Source</strong>! A complete platform merging a high-performance 
    <br />Discord bot with a stunning web dashboard to deliver the ultimate server management experience.
  </p>
</div>

<br />

<div align="center">
  
  [![Patreon](https://img.shields.io/badge/Support_on_Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://patreon.com/hadi4100)
  &nbsp;&nbsp;
  [![Support](https://img.shields.io/badge/📞_Get_Support-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/4EbSFSJZqH)
  
</div>

<hr />

## 🖼️ Dashboard Showcase

<div align="center">
  <img src="assets/Screenshot 2026-02-11 140709.png" width="45%" alt="Dashboard Home" />
  <img src="assets/Screenshot 2026-02-11 140725.png" width="45%" alt="Server Settings" />
  <br />
  <img src="assets/Screenshot 2026-02-11 140841.png" width="45%" alt="Moderation" />
  <img src="assets/Screenshot 2026-02-11 140915.png" width="45%" alt="Tickets" />
  <br />
  <img src="assets/Screenshot 2026-02-11 140956.png" width="45%" alt="Giveaways" />
  <img src="assets/Screenshot 2026-02-11 141021.png" width="45%" alt="AutoMod" />
</div>

<hr />

## 🎗️ Sponsor & Support the Project

Vantyx is now open-source, but development continues through community support!

**Current Goal:** $15 / month

- **Goal:** To host the project on a high-performance VPS, ensuring the bot stays online 24/7 for the community.
- **Reward:** When we reach this target, I will release a major update including:
  - 🔔 **Social Notifications:** YouTube, TikTok, Twitch, and Kick integration.
  - 🚀 And much more...

**Become a Sponsor:** [patreon.com/hadi4100](https://patreon.com/hadi4100)

<hr />

## 📌 Release Info

- **Current Version:** `v1.0 (The Starter)`
- **Status:** Stable Release (Open Source)

<hr />

## ✨ Features

<table>
  <tr>
    <td width="33%">
      <h3>🛡️ Advanced Moderation</h3>
      <p>Keep your community safe with automated filters, rigorous logging, and swift justice tools (Ban, Kick, Timeout) accessible directly from Discord or the Dashboard.</p>
    </td>
    <td width="33%">
      <h3>📈 Engagement & Levels</h3>
      <p>Gamify your server with a robust XP system. Custom rank cards, leaderboards, and role rewards keep your members active and engaged.</p>
    </td>
    <td width="33%">
      <h3>🎟️ Professional Support</h3>
      <p>A complete ticketing system with transcript generation. Handle user inquiries privately and professionally without leaving Discord.</p>
    </td>
  </tr>
  <tr>
    <td width="33%">
      <h3>🎁 Events & Giveaways</h3>
      <p>Host exciting giveaways with ease. Supports instant "Drops", intricate requirements, and automatic winner selection.</p>
    </td>
    <td width="33%">
      <h3>🌍 Global Ready</h3>
      <p>Built from the ground up with <strong>English</strong> and <strong>Arabic</strong> support, automatically adapting to your server's language preference.</p>
    </td>
    <td width="33%">
      <h3>🎨 Creative Tools</h3>
      <p>Stunning Welcome/Goodbye images powered by Canvas, fully customizable to match your server's unique aesthetic.</p>
    </td>
  </tr>
</table>

<br />

## 🛠️ The Stack

<div align="center">
  <img src="https://skillicons.dev/icons?i=js,discord,nextjs,express,mongodb,tailwind" alt="Tech Stack" />
</div>

<br />

## 🚀 Quick Start

Get Vantyx up and running in minutes. The project uses **NPM Workspaces** to manage the Bot, API, and Dashboard.

### 1. Prerequisites

- [Node.js v18+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas)
- A [Discord Bot Token](https://discord.com/developers/applications)

### 2. Configure

1.  **Environment Variables:** Rename `config.sample.js` to `config.js`.
2.  **Discord Secrets:** Open `config.js` and fill in your `DISCORD_TOKEN`, `CLIENT_ID`, and `CLIENT_SECRET`.
3.  **Discord Developer Portal Setup:**
    - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
    - Select your application and navigate to the **OAuth2** tab.
    - Click **Add Redirect** and enter: `http://localhost:3000/login`.
    - Click **Save Changes**.
4.  **Database Connection:**
    - Ensure your `MONGO_URI` in `config.js` is correct (default: `mongodb://localhost:27017/vantyx`).

```javascript
/* config.js */
module.exports = {
  DISCORD_TOKEN: "YOUR_TOKEN",
  CLIENT_ID: "YOUR_APP_ID",
  CLIENT_SECRET: "YOUR_SECRET",
  MONGO_URI: "mongodb://localhost:27017/vantyx",
  // ...
};
```

### 3. Launch 🚀

Install dependencies and start all services at once from the root directory.

```bash
# 1. Install dependencies for all workspaces
npm install

# 2. Run all services in development mode (with hot-reload)
npm run dev

# OR: Run all services in production mode
npm start
```

### 4. Individual Service Control 🛠️

If you need to run or debug services individually:

```bash
# Start only the Bot
npm run dev:bot

# Start only the API
npm run dev:api

# Start only the Dashboard
npm run dev:dashboard
```

<br />

> **Services Online:**
>
> - 🖥️ **Dashboard:** `http://localhost:3000`
> - 🔌 **API:** `http://localhost:4000`

<br />

## 📂 Project Structure

| Path             | Description                                                  |
| :--------------- | :----------------------------------------------------------- |
| **`/bot`**       | The core Discord client logic, event handlers, and commands. |
| **`/dashboard`** | Next.js 16+ web interface for managing the bot configs.      |
| **`/api`**       | Express.js backend API serving data between DB and Frontend. |
| **`config.js`**  | Central configuration file for all services.                 |

<br />

## 📜 License

This project is licensed under the **MIT License**. See [LICENSE.md](LICENSE.md) for details.

---

<div align="center">
  <sub>Built with ❤️ by Hadi. Open Source Project.</sub>
</div>
