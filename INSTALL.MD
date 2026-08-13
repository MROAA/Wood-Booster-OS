Here is a first version of installation documentation for Wood-Booster OS based on the current project state.

You can save this as:

INSTALL.md
Wood-Booster OS Installation Guide
Overview

Wood-Booster OS is a desktop application built with:

Tauri 2 desktop framework
React + Vite frontend
Node.js backend sidecar
Prisma database layer
Spacemonkey AI Operator runtime

The application can run as:

Development environment
Desktop application from source
Packaged Linux application (AppImage / DEB / RPM)
1. System Requirements
Supported OS

Currently tested:

Linux x86_64
CachyOS / Arch Linux environment

Other Linux distributions may work if dependencies are available.

2. Hardware Requirements

Recommended:

Component	Minimum	Recommended
CPU	4 cores	8+ cores
RAM	8 GB	16+ GB
Storage	5 GB	20+ GB
GPU	Optional	NVIDIA RTX / AMD GPU

For local AI workloads:

NVIDIA CUDA support recommended
Ollama recommended for local models
3. Required Software Dependencies
Node.js

Required:

Node.js >= 20

Check:

node --version

Example:

v26.x.x
npm

Check:

npm --version
Rust Toolchain

Required for Tauri builds.

Install:

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

Restart terminal.

Check:

rustc --version
cargo --version
Tauri System Dependencies
Arch / CachyOS

Install:

sudo pacman -S webkit2gtk-4.1 \
gtk3 \
libappindicator-gtk3 \
librsvg \
openssl
4. Clone Repository

Clone:

git clone https://github.com/MROAA/Wood-Booster-OS.git

Enter project:

cd Wood-Booster-OS
5. Install Frontend Dependencies

Run:

npm install

This installs:

React
Vite
Tailwind
Tauri CLI
Build tools
6. Backend Setup

Enter server:

cd server

Install dependencies:

npm install

Return:

cd ..
7. Database Configuration

Wood-Booster OS uses Prisma.

Database location:

Development:

server/prisma/dev.db

Desktop application:

~/.local/share/com.woodbooster.os/

The Tauri application automatically creates the application data directory.

8. Environment Variables

Create:

server/.env

Example:

PORT=3001

DATABASE_URL="file:./prisma/dev.db"

OLLAMA_URL="http://localhost:11434"
9. Initialize Prisma

Inside server:

cd server

Run:

npx prisma generate

Database migration:

npx prisma migrate dev

Return:

cd ..
10. Development Mode
Start backend

Terminal 1:

cd server
node index.js

Expected:

🪵 Wood-Booster Server käynnissä

http://localhost:3001
Start frontend

Terminal 2:

npm run dev

Open:

http://localhost:5173
11. Build Desktop Application

Build frontend + Tauri:

npm run tauri build
12. Build AppImage

For Linux AppImage:

npm run tauri build -- --bundles appimage

Output:

src-tauri/target/release/bundle/appimage/

Example:

Wood-Booster OS_0.1.0_amd64.AppImage
13. Run AppImage

Make executable:

chmod +x "Wood-Booster OS_0.1.0_amd64.AppImage"

Run:

./"Wood-Booster OS_0.1.0_amd64.AppImage"
14. Desktop Application Data

The application stores user data here:

~/.local/share/com.woodbooster.os

Contains:

database
uploads
application state
15. AI Configuration

Wood-Booster OS supports local AI through Ollama.

Install Ollama:

curl -fsSL https://ollama.com/install.sh | sh

Start:

ollama serve

Example model:

ollama pull qwen2.5:7b

Configuration:

OLLAMA_URL=http://localhost:11434
16. Troubleshooting
AppImage does not start

Check permissions:

chmod +x *.AppImage

Run from terminal to view logs.

Backend does not start

Check:

curl http://localhost:3001/api/health
Database problems

Regenerate Prisma:

cd server
npx prisma generate
Build problems

Clean Tauri build:

rm -rf src-tauri/target

Rebuild:

npm run tauri build
17. Project Structure
Wood-Booster-OS/

├── src/                    # React frontend
├── server/                 # Node backend
│   ├── routes/
│   ├── services/
│   ├── prisma/
│   └── index.js
│
├── src-tauri/              # Desktop application
│   ├── src/
│   ├── resources/
│   ├── binaries/
│   └── tauri.conf.json
│
└── package.json
18. Production Release Checklist

Before release:

 Update version number
 Test AppImage
 Test DEB package
 Test RPM package
 Verify database migration
 Verify backend startup
 Verify Spacemonkey runtime
 Create GitHub release
Current Version
Wood-Booster OS 0.1.0

Status:

✅ Desktop application build working
✅ Tauri packaging working
✅ AppImage working
✅ Backend sidecar working
✅ Spacemonkey runtime loading

This can now become the official installation document for the repository.
