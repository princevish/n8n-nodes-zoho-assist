# n8n-nodes-zoho-assist

🚀 Full-featured Zoho Assist integration for n8n with session automation, recording downloads, and cloud storage pipeline support.

---

## ✨ Features

### 🔐 Authentication
- **OAuth2** (Auto-refresh supported via `access_type=offline`)
- **Multi-Data Center support** (India, US, EU, Australia, China, Japan)

### 🖥️ Core APIs
- **Sessions**: Create, Schedule, and Start Unattended sessions.
- **Devices**: List and get details of unattended computers.
- **Groups**: Create and list unattended computer groups.
- **Reports**: List session reports and access recording metadata.
- **Users**: Get technician and organization information.

### 🎥 Recording Support
- **Download session videos**: Directly download recordings as binary data (`.mp4`).
- **Binary Output**: Perfect for direct upload to cloud storage.

### ☁️ Cloud Pipeline Ready
- Works seamlessly with:
  - **Backblaze B2** (S3-compatible)
  - **AWS S3**
  - **Google Drive**
- Optimized for large file handling and memory efficiency.

### ⚙️ Production Grade
- **Automatic Retries** with exponential backoff for 5xx and 429/401 errors.
- **Department ID Support**: Mandatory for multi-department organizations.
- **Custom API Call**: Future-proof support for any endpoint not mapped yet.

---

## 📦 Installation

### Option 1 — n8n UI (Recommended)
1. Go to **Settings > Community Nodes**.
2. Click **Install a node**.
3. Enter `n8n-nodes-zoho-assist`.
4. Agree to the TOS and click **Install**.

### Option 2 — Manual (CLI)
In your n8n installation directory, run:
```bash
npm install n8n-nodes-zoho-assist
```

---

## 🔐 Credentials Setup

1. Go to the [Zoho Developer Console](https://api-console.zoho.in/) (use your region's URL like `.in`, `.com`, or `.eu`).
2. Click **Add Client** and select **Server-based Applications**.
3. **Internal Client**: Enter any Client Name.
4. **Redirect URI**: Use the URL provided in the n8n credential setup page (e.g., `https://your-n8n.com/rest/oauth2-callback`).
5. Copy the **Client ID** and **Client Secret**.
6. In n8n, choose your **Data Center** and paste the IDs.

### Required Scopes
The node uses the following scopes by default:
- `ZohoAssist.sessionapi.ALL`
- `ZohoAssist.unattended.computer.ALL`
- `ZohoAssist.unattended.group.ALL`
- `ZohoAssist.unattended.device.CREATE`
- `ZohoAssist.reportapi.READ`
- `ZohoAssist.userapi.READ`

---

## 🚀 Resources & Operations

| Resource | Operations |
| :--- | :--- |
| **Session** | Create, Schedule, Start Unattended |
| **Device** | List, Get |
| **Group** | Create, List |
| **Report** | List, Download Recording |
| **User** | Get Info |
| **Custom API** | GET, POST, PUT, DELETE, PATCH |

### 💡 Pro Tip: Department ID
If you are part of a Zoho organization with multiple departments, make sure to provide the **Department ID** in the node parameters. You can find this ID in Zoho Assist under *Settings > General > Department*.

---

## 📄 License
[MIT](LICENSE)

## 🤝 Support
For bugs and feature requests, please open an [Issue](https://github.com/princevish/n8n-nodes-zoho-assist/issues).

---
Made with ❤️ by [Prince Vishwakarma](https://github.com/princevish)
