# College Attendance Management System

A simple college attendance application: **React → FastAPI → MySQL**.

MySQL is **not** installed on the laptop. It runs as a **Docker container**. FastAPI connects to it using the Docker Compose service name `mysql` (not `localhost`). The whole stack is started with **one command**: `docker compose up --build`.

This matches the course requirement:

> Remove local MySQL, run MySQL as a Docker container, change the backend connection, and start everything with Docker Compose on a server.

---

## 1. What this project is

Students, subjects, and attendance records are stored in MySQL.

- The **browser** talks only to the React UI.
- **React** talks only to FastAPI over HTTP (`/api/...`).
- **FastAPI** talks only to MySQL.
- **React never connects to MySQL.**

You do **not** need:

- MySQL installed on Windows
- `npm run dev` on the host
- `uvicorn` on the host

You **do** need:

- Docker Desktop (Windows) or Docker Engine + Compose (Linux / EC2)

---

## 2. Technology stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), nginx in production |
| Backend | FastAPI (Python), SQLAlchemy, Pydantic |
| Database | MySQL 8.0 official Docker image |
| Containers | Docker |
| Orchestration | Docker Compose |
| Deployment host | Your laptop **or** AWS EC2 (Docker host) |

---

## 3. Architecture (end to end)

### 3.1 Request path

```
Your browser
    │
    │  http://localhost:3000          (laptop)
    │  http://<EC2-public-IP>:3000    (server)
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Docker Compose network: attendance-net                      │
│                                                              │
│  ┌─────────────────────┐                                     │
│  │ frontend            │  nginx serves the React build       │
│  │ container           │  and forwards /api/*                │
│  │ port 3000 → 80      │──────────────┐                      │
│  └─────────────────────┘              │                      │
│                                       ▼                      │
│                          ┌─────────────────────┐             │
│                          │ backend             │  FastAPI    │
│                          │ container           │  uvicorn    │
│                          │ port 8000 → 8000    │             │
│                          └──────────┬──────────┘             │
│                                     │                        │
│                          DB_HOST=mysql                       │
│                          port 3306 (internal only)           │
│                                     ▼                        │
│                          ┌─────────────────────┐             │
│                          │ mysql               │  official   │
│                          │ container           │  mysql:8.0  │
│                          │ NOT published       │             │
│                          │ to the internet     │             │
│                          └──────────┬──────────┘             │
└─────────────────────────────────────┼────────────────────────┘
                                      ▼
                         Docker volume: mysql_data
                         (data survives container restarts)
```

### 3.2 Why `DB_HOST=mysql` and not `localhost`

| Setup | `DB_HOST` | What happens |
|---|---|---|
| Old local MySQL on the laptop | `localhost` | FastAPI talks to MySQL installed on Windows |
| This project (Docker Compose) | `mysql` | FastAPI talks to the **mysql service** on the Compose network |

Inside Compose, `mysql` is a DNS name. The backend container resolves it to the MySQL container. `localhost` inside the backend container would mean “this backend container itself”, **not** your laptop and **not** the MySQL container.

`docker-compose.yml` **forces** this:

```yaml
environment:
  DB_HOST: mysql
```

So the backend cannot accidentally use a host MySQL install.

### 3.3 What each container does

**frontend (`attendance-frontend`)**

1. Docker builds the React app (`npm run build`).
2. nginx serves the static files on port 80 (mapped to host **3000**).
3. When the browser requests `/api/...`, nginx **proxies** to `http://backend:8000/api/...`.
4. That is why the React code uses relative URLs like `/api/students` and never talks to MySQL.

**backend (`attendance-backend`)**

1. FastAPI starts with uvicorn on port 8000.
2. It reads `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` from the environment.
3. It **waits/retries** until MySQL accepts connections (MySQL is slow on first boot).
4. Compose starts backend only after MySQL’s **healthcheck** is healthy.
5. REST APIs create/read students, subjects, and attendance in MySQL.

**mysql (`attendance-mysql`)**

1. Official `mysql:8.0` image.
2. Creates database `attendance_db` and user `attendance_user` from `.env`.
3. Runs `mysql/init.sql` on **first** start (empty volume) to create tables.
4. Stores files in the named volume `mysql_data`.
5. Port **3306 is not published** to the host or the internet. Only containers on `attendance-net` can reach it.

### 3.4 Ports (what is public)

| Port | Published? | Purpose |
|---|---|---|
| 3000 | Yes | Open the React app in a browser |
| 8000 | Yes | FastAPI health check and API docs (useful for evaluation) |
| 3306 | **No** | MySQL stays private on the Docker network |

### 3.5 Data model

```
students  1 ───<  attendance  >─── 1  subjects
```

- **students**: name, roll number, email
- **subjects**: name, code
- **attendance**: student, subject, date, status (`Present` or `Absent`)
- Unique: one record per student + subject + date (saving again updates the status)

---

## 4. Folder structure

```
.
├── docker-compose.yml      All three services, network, volume
├── .env.example            Template for secrets (commit this)
├── .env                    Real passwords (do NOT commit)
├── .gitignore
├── README.md
│
├── mysql/
│   └── init.sql            Tables created on first MySQL start
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py         FastAPI app, CORS, startup wait
│       ├── config.py       Reads DB_* environment variables
│       ├── database.py     SQLAlchemy + retry until MySQL is up
│       ├── models/         Student, Subject, Attendance
│       ├── schemas/        Pydantic request/response models
│       └── routes/         /api/health, students, subjects, attendance
│
└── frontend/
    ├── Dockerfile          Build React, then serve with nginx
    ├── nginx.conf          SPA + proxy /api → backend:8000
    ├── package.json
    └── src/
        ├── api.js          HTTP calls to /api/...
        ├── pages/          Dashboard, Students, Attendance, Summary
        └── components/     Layout, status banners
```

---

## 5. Features

- **Dashboard** — student count, subject count, present/absent totals, overall %, and a live `DB_HOST` health check
- **Students** — add, list, delete; add/list subjects
- **Attendance** — select student + subject + date, mark Present/Absent, view records
- **Summary** — per-student present count, absent count, attendance percentage
- Responsive React UI with loading, error, and empty states

---

## 6. How to start the project (local / laptop)

These commands are for **Windows PowerShell**. Run them in the project folder:

`e:\ICL-College Attendance (React + FastAPI) project`

### Step 0 — Install Docker (once)

1. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
2. Start **Docker Desktop** and wait until it says it is running.
3. Confirm:

```powershell
docker version
docker compose version
```

If `docker version` shows a pipe / daemon error, Docker Desktop is not running yet. Open it and wait.

You do **not** install MySQL, Node, or Python for the normal run.

### Step 1 — Create `.env`

If `.env` does not exist:

```powershell
Copy-Item .env.example .env
```

Open `.env` and keep:

```env
DB_HOST=mysql
DB_PORT=3306
```

Change passwords if you want. Use the same password for `MYSQL_PASSWORD` and `DB_PASSWORD`.

Never commit `.env` to GitHub (it is already in `.gitignore`).

### Step 2 — Start everything

```powershell
docker compose up --build
```

What this does:

1. Builds the **frontend** image (React build + nginx)
2. Builds the **backend** image (FastAPI)
3. Pulls **mysql:8.0** if needed
4. Creates network `attendance-net` and volume `mysql_data`
5. Starts MySQL, waits until it is healthy
6. Starts FastAPI (`DB_HOST=mysql`)
7. Starts nginx + React

First start can take several minutes (image download + npm build). Later starts are faster.

To run in the background (terminal stays free):

```powershell
docker compose up --build -d
```

### Step 3 — Open the app

| What | URL |
|---|---|
| React UI | http://localhost:3000 |
| FastAPI health | http://localhost:8000/api/health |
| FastAPI docs | http://localhost:8000/docs |

Health should look like:

```json
{
  "status": "ok",
  "database": "connected",
  "db_host": "mysql",
  "db_name": "attendance_db"
}
```

`db_host` must be **`mysql`**, not `localhost`.

### Step 4 — Use the app (quick test)

1. **Students** — add a student and a subject
2. **Attendance** — mark Present or Absent
3. **Summary** — select the student and check percentage
4. **Dashboard** — counts should update

---

## 7. Docker Compose commands

Run all of these from the **project root** (the folder that contains `docker-compose.yml`).

| Command | What it does |
|---|---|
| `docker compose up --build` | Build images and start all containers (logs in this terminal) |
| `docker compose up --build -d` | Same, but detached (background) |
| `docker compose ps` | Show frontend, backend, mysql status |
| `docker compose logs` | All logs |
| `docker compose logs backend` | FastAPI logs (DB connection, errors) |
| `docker compose logs mysql` | MySQL startup logs |
| `docker compose logs frontend` | nginx logs |
| `docker compose down` | Stop and remove containers (keeps MySQL data in the volume) |
| `docker compose down -v` | Stop and **delete MySQL data** (fresh database next start) |
| `docker ps` | Same idea as Compose ps, Docker-wide |

### Prove MySQL is a container (not a local install)

```powershell
docker compose ps
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"
```

You should see:

- `attendance-frontend`
- `attendance-backend`
- `attendance-mysql`  ← this is MySQL, as a container

### Prove FastAPI can talk to MySQL

```powershell
curl http://localhost:8000/api/health
```

Or in the browser: http://localhost:8000/api/health  
`database` should be `connected` and `db_host` should be `mysql`.

### Prove data is actually in MySQL

```powershell
docker exec -it attendance-mysql mysql -uattendance_user -pchange_this_db_password attendance_db -e "SHOW TABLES; SELECT * FROM students; SELECT * FROM attendance;"
```

Use the password from your `.env` if you changed it.

---

## 8. Environment variables

Defined in `.env.example`. Copy to `.env` on the laptop **and** on EC2.

| Variable | Used by | Meaning |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | mysql container | MySQL root password |
| `MYSQL_DATABASE` | mysql container | Database name (`attendance_db`) |
| `MYSQL_USER` | mysql container | App database user |
| `MYSQL_PASSWORD` | mysql container | App database password |
| `DB_HOST` | FastAPI | Must be `mysql` inside Compose |
| `DB_PORT` | FastAPI | `3306` |
| `DB_USER` | FastAPI | Same as `MYSQL_USER` |
| `DB_PASSWORD` | FastAPI | Same as `MYSQL_PASSWORD` |
| `DB_NAME` | FastAPI | Same as `MYSQL_DATABASE` |

Do not put passwords in Python or JavaScript source files.

---

## 9. API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | App + MySQL status (`db_host`) |
| GET | `/api/dashboard` | Totals for the dashboard |
| GET | `/api/students` | List students |
| POST | `/api/students` | Add student |
| DELETE | `/api/students/{id}` | Delete student |
| GET | `/api/subjects` | List subjects |
| POST | `/api/subjects` | Add subject |
| GET | `/api/attendance` | List records |
| POST | `/api/attendance` | Mark Present/Absent |
| GET | `/api/attendance/student/{id}/summary` | Percentage, present, absent |

Interactive docs: http://localhost:8000/docs

---

## 10. Deploy on AWS EC2 (Docker host)

This is the same app. There is no Kubernetes. EC2 is just a Linux machine running Docker Compose.

### 10.1 Create the instance

1. AWS Console → EC2 → Launch instance
2. Name: `college-attendance`
3. AMI: **Ubuntu Server 22.04 LTS** (or Amazon Linux 2023)
4. Instance type: **t2.micro** or **t3.small** (t3.small is more comfortable for the first image build)
5. Key pair: create/download a `.pem` key
6. Storage: 20 GB is enough
7. Security group inbound rules:

| Type | Port | Source | Why |
|---|---|---|---|
| SSH | 22 | My IP | So you can log in |
| Custom TCP | 3000 | 0.0.0.0/0 | React UI |
| Custom TCP | 8000 | 0.0.0.0/0 | FastAPI health (evaluation) |

**Do not open port 3306.**

### 10.2 Connect with SSH

From PowerShell (path to your `.pem` will differ):

```powershell
ssh -i "$env:USERPROFILE\Downloads\your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

On Amazon Linux the user is often `ec2-user` instead of `ubuntu`.

### 10.3 Install Docker on Ubuntu

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu
newgrp docker
docker compose version
```

### 10.4 Copy the project onto EC2

**Option A — git clone** (if the repo is on GitHub):

```bash
git clone <your-repo-url>
cd "<repo-folder>"
```

**Option B — copy from your laptop** (from PowerShell on Windows):

```powershell
scp -i "$env:USERPROFILE\Downloads\your-key.pem" -r "e:\ICL-College Attendance (React + FastAPI) project" ubuntu@<EC2-PUBLIC-IP>:~/college-attendance
```

Then on EC2:

```bash
cd ~/college-attendance
```

### 10.5 Create `.env` on the server

```bash
cp .env.example .env
nano .env
```

Set strong passwords. Keep `DB_HOST=mysql`.

### 10.6 Start the app

```bash
docker compose up --build -d
docker compose ps
curl http://127.0.0.1:8000/api/health
```

### 10.7 Open from your browser

`http://<EC2-PUBLIC-IP>:3000`

Health: `http://<EC2-PUBLIC-IP>:8000/api/health`

### 10.8 Stop / restart

```bash
docker compose down          # stop
docker compose up -d         # start again (no rebuild)
docker compose logs -f       # follow logs
```

---

## 11. Testing checklist

1. Docker is running; MySQL is **not** required on the host
2. `docker compose up --build` starts three containers
3. http://localhost:3000 loads the React UI
4. http://localhost:8000/api/health shows `"database": "connected"` and `"db_host": "mysql"`
5. You can add a student
6. You can add a subject
7. You can mark attendance
8. Summary shows present / absent / percentage
9. `docker exec` into MySQL shows the same rows

---

## 12. Troubleshooting

### Docker is not running

```powershell
docker version
```

**Fix:** Start Docker Desktop and wait until the engine is running.

### Permission denied (Linux / EC2)

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Port 3000 or 8000 already in use

```powershell
docker compose down
netstat -ano | findstr ":3000 :8000"
```

Stop the other program, or change the left-hand port in `docker-compose.yml` (example: `"3001:80"`).

### MySQL container not starting

```powershell
docker compose logs mysql
```

Common cause: bad password characters in `.env`, or a leftover volume from an old password.

**Fix (erases DB data):**

```powershell
docker compose down -v
docker compose up --build -d
```

### FastAPI cannot connect to MySQL

```powershell
docker compose logs backend
curl http://localhost:8000/api/health
```

Checks:

- `DB_HOST` in Compose is `mysql` (not `localhost`)
- mysql container is `healthy` in `docker compose ps`
- backend and mysql share `attendance-net`

### React loads but API fails / CORS

The UI should call `/api` on **port 3000** (nginx proxy). If you opened the UI incorrectly, use http://localhost:3000 not a `file://` page.

```powershell
docker compose logs frontend
docker compose logs backend
```

### EC2: page does not open from the internet

- Security group must allow **3000** (and 8000 if you test health remotely)
- You must use the **public IP**, not `localhost` on your laptop
- `docker compose ps` on EC2 must show containers running

### `init.sql` did not run

Init scripts run only on an **empty** volume. After a schema change:

```powershell
docker compose down -v
docker compose up --build -d
```

---

## 13. Security notes

- `.env` is gitignored. Do not put passwords in GitHub.
- MySQL port 3306 is not published.
- Change default passwords before putting the app on EC2.

---

## 14. Evaluation demonstration (5–10 minutes)

1. Show the React UI at port 3000 (Dashboard / Students / Attendance).
2. Show FastAPI docs or health: `/api/health` with `"db_host": "mysql"`.
3. Show `docker compose ps` — three containers, including `attendance-mysql`.
4. State clearly: MySQL is **not** installed on the host; it is the `mysql:8.0` container.
5. Show `docker-compose.yml`: `DB_HOST: mysql`, no `3306` published.
6. Add a student, mark attendance, show it in the UI.
7. `docker exec` into MySQL and `SELECT` the same row.
8. If deployed: open `http://<EC2-IP>:3000` and repeat health check.

**Screenshots to keep**

1. React dashboard in the browser
2. `/api/health` JSON with `db_host: mysql`
3. `docker compose ps` (three services)
4. `docker-compose.yml` `DB_HOST: mysql` section
5. Student + attendance in the UI
6. `SELECT` from MySQL inside the container
7. EC2 security group (ports 22, 3000, 8000 — not 3306)
8. Browser open on the EC2 public IP

---

## 15. What “done” looks like

```powershell
docker compose up --build -d
docker compose ps
```

Three running containers. Browser: http://localhost:3000. No local MySQL. FastAPI connected to `mysql:3306` on the Docker network.
