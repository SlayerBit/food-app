# 🍔 FoodDash – Cloud-Native Food Ordering System

## 🚀 Overview

FoodDash is a **production-grade full-stack food ordering application** built with a modern cloud-native architecture.

It integrates:

- Scalable backend on Kubernetes (GKE)
- Managed PostgreSQL database (Neon)
- Real-time observability (Prometheus + Loki + Grafana)
- Public APIs for monitoring and AI-agent integration

---

# 🧱 Architecture

```text
Frontend (Vercel)
        ↓
Backend (Node.js + Kubernetes - GKE)
        ↓
Neon PostgreSQL

Observability Layer:
Backend → Prometheus (metrics)
Backend → Loki (logs)
        ↓
Grafana (dashboard)
```

---

# 🌐 Live Application

## 🔹 Frontend

```text
https://food-app-psi-vert.vercel.app/
```

---

## 🔹 Backend API

```text
http://34.47.174.91.sslip.io/api
```

Example:

```text
http://34.47.174.91.sslip.io/api/restaurants
```

---

## 🔹 Observability Endpoints

### Prometheus (Metrics)

```text
http://34.14.220.142:9090
```

### Loki (Logs)

```text
http://34.47.215.128:3100
```

### Grafana (Dashboard)

```text
http://35.200.147.11:3000
```

Login:

```text
admin / admin
```

---

# 🧠 Core Features

## Application

- User authentication (JWT based)
- Role-based access (USER / ADMIN)
- Restaurant browsing
- Menu viewing
- Cart & order system

## Infrastructure

- Kubernetes deployment (GKE)
- Ingress-based routing
- Managed PostgreSQL (Neon)

## Observability

- Metrics collection (Prometheus)
- Log aggregation (Loki + Promtail)
- Visualization dashboards (Grafana)

## AI Readiness

- External APIs for metrics & logs
- Structured logging (JSON)
- Supports intelligent monitoring systems

---

# 📊 Metrics & Logs Coverage

### Direct Metrics

- CPU, Memory, Disk
- Request rate
- Error rate
- Latency

### Logs

- Request lifecycle logs
- Errors & failures
- Structured JSON logs

---

# 🔐 Test Credentials

## Admin

```text
Email: admin@foodapp.com
Password: admin123
```

## User

```text
Email: user@foodapp.com
Password: user123
```

---

# 🛠️ Tech Stack

- **Frontend:** React + Vercel
- **Backend:** Node.js + Express
- **Database:** Neon PostgreSQL
- **Containerization:** Docker
- **Orchestration:** Kubernetes (GKE)
- **Monitoring:** Prometheus
- **Logging:** Loki + Promtail
- **Visualization:** Grafana

---

# 📌 System Status

```text
Frontend → Live on Vercel ✅
Backend → Running on GKE ✅
Database → Connected (Neon) ✅
Metrics → Prometheus Active ✅
Logs → Loki Ingesting ✅
Dashboard → Grafana Operational ✅
```

---

# 🚀 Highlights

- Production-grade deployment
- Real-time observability
- External monitoring APIs
- Kubernetes-native architecture
- AI-agent integration ready

---

# 🔮 Future Improvements

- AI anomaly detection
- Auto-scaling strategies
- Advanced dashboards
- Order analytics & tracking
- CI/CD automation

---

# 📎 Repository Usage

To deploy locally or inspect configs:

```bash
# clone repo
git clone https://github.com/SlayerBit/food-app.git

# go to backend
cd backend

# install deps
npm install
```

---

# 📌 Summary

FoodDash demonstrates a **complete real-world system** combining:

- Full-stack application
- Cloud infrastructure
- Observability stack
- AI-ready monitoring pipeline
