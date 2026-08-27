# Construction Management System (CMS)

A comprehensive web-based platform designed to streamline construction project management, including project tracking, workforce management, material procurement, and financial monitoring.

🔗 **Live Demo:** https://construction-management-system-xxxx.onrender.com
*(replace with your actual Render URL — note: free tier spins down after inactivity, so the first load may take 30–60 seconds)*

## 🚀 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Frontend:** HTML5, Vanilla CSS, JavaScript
- **Authentication:** JSON Web Tokens (JWT), Bcrypt.js
- **File Uploads:** Multer

## 📂 Folder Structure

```text
CMS/
├── Backend/                # Server-side logic
│   ├── config/             # Database configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth & validation middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API endpoints
│   ├── uploads/            # Uploaded files (3D models, reports)
│   ├── utils/              # Helper functions
│   ├── server.js           # Main entry point
│   └── package.json        # Dependencies
├── Frontend/               # Client-side interface
│   ├── admin/              # Admin dashboard pages
│   ├── client/             # Client dashboard pages
│   ├── engineer/           # Engineer dashboard pages
│   ├── worker/             # Worker dashboard pages
│   ├── css/                # Stylesheets
│   ├── js/                 # Application logic
│   └── index.html          # Main login page
└── requirements.txt        # Dependency list (Node.js)
```

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd CMS
   ```

2. **Backend Setup:**
   ```bash
   cd Backend
   npm install
   ```

3. **Set up a MongoDB database:**
   This project needs a real MongoDB connection — it does **not** create one for you.
   - Easiest option: create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), add a database user, and allow network access from `0.0.0.0/0` (or your specific IP).
   - Copy your connection string — it looks like:
     `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/cms`
   - Make sure to include a database name (e.g. `/cms`) before the `?` in the string.

4. **Environment Variables:**
   Create a `.env` file in the `Backend` directory:
   ```env
   PORT=5500
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
   ⚠️ **Never commit `.env` to git.** It's already excluded via `.gitignore` — double check it's not showing up in `git status` before you push.

5. **Run the Application:**
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:5500`.

## ☁️ Deployment

This project is deployed on [Render](https://render.com) as a Node.js Web Service.

| Setting | Value |
|---|---|
| Root Directory | `Backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Environment Variables | `MONGO_URI`, `JWT_SECRET` (same as local `.env`, without `PORT` — Render sets this automatically) |

The database is hosted separately on MongoDB Atlas — Render's free tier has no persistent local storage, so a cloud database is required regardless of hosting provider.

**Note:** file uploads (3D models, reports) are saved to local disk (`Backend/uploads/`), which does **not** persist across deploys/restarts on Render's free tier. For production use, uploads should be migrated to a cloud storage provider (e.g. Cloudinary or S3).

## ✨ Key Features

- **Role-based Dashboards:** Custom views for Admins, Clients, Engineers, and Workers.
- **Project Tracking:** Real-time updates on project progress and milestones.
- **Materials Management:** Inventory and procurement tracking.
- **Attendance & Salary:** Automated attendance logs and salary calculations.
- **Change Requests:** Streamlined process for project modifications.
- **Advanced Analytics:** Data-driven insights into project performance.
- **3D Viewer:** Integrated viewer for architectural designs and 3D models.
