# Setup Guide — MiniSupermarket Backend

> **Who this is for:** You, the frontend developer who has never set up a backend before.
> **Reading time:** ~15 minutes. Follow every step in order.

---

## Short Answer: Do You Need MongoDB Atlas (Cloud)?

**No — not for running locally.** The backend uses Docker, which bundles MongoDB, Redis, and Kafka all inside containers on your computer. Nothing needs to be installed separately or configured in the cloud.

If you want to deploy to the internet one day, you would need Atlas then. For now, Docker handles everything.

---

## What Is Docker?

Think of Docker as a box that packages the entire backend (all 6 services + database + cache + message queue) and runs them together with one command. You don't need to install Node.js, MongoDB, Redis, or Kafka separately — Docker does it all.

---

## Step 1 — Install Docker Desktop

1. Go to [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Download **Docker Desktop for Windows**
3. Run the installer (it may require a restart)
4. After restart, open Docker Desktop and wait for it to say **"Engine running"** in the bottom-left corner
5. Verify it works: open a terminal and run:
   ```
   docker --version
   ```
   You should see something like `Docker version 27.x.x`

> **Important:** Docker Desktop must be running (open in taskbar) every time you start the backend.

---

## Step 2 — Set Up Environment Files

The backend services need configuration files (`.env` files) to know secrets, database URLs, and API keys. These are not committed to Git for security reasons, so you must create them manually.

Navigate to `be-e.commerce/` in your project.

### 2a. Gateway environment file

Create file: `be-e.commerce/gateway/.env.docker`

```env
PORT=3000
NODE_ENV=production
USER_SERVICE_URL=http://user-service:3001
MAIL_SERVICE_URL=http://mail-service:3002
PRODUCT_SERVICE_URL=http://inventory-service:3003
ACTIVITY_SERVICE_URL=http://activity-service:3004
PAYMENT_SERVICE_URL=http://payment-service:3005
JWT_SECRET=mysecretkey_change_this_in_production
SLACK_WEBHOOK_URL=
INTERNAL_SECRET=my_internal_secret_key
ADMIN_ALLOWED_IPS=127.0.0.1,::1,::ffff:127.0.0.1
```

### 2b. User Service environment file

Create file: `be-e.commerce/services/userServices/.env.docker`

```env
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/ecommerce_users
JWT_SECRET=mysecretkey_change_this_in_production
JWT_REFRESH_SECRET=myrefreshsecretkey_change_this_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
MAIL_SERVICE_URL=http://mail-service:3002
INTERNAL_SECRET=my_internal_secret_key
ADMIN_ALLOWED_IPS=127.0.0.1,::1
ADMIN_PASSWORD=Admin@123456
```

> **Note:** `ADMIN_PASSWORD` is the initial superadmin account password. Write it down.

### 2c. Mail Service environment file

Create file: `be-e.commerce/services/mailServices/.env.docker`

```env
PORT=3002
NODE_ENV=production
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_gmail_address@gmail.com
MAIL_PASS=your_gmail_app_password
MAIL_FROM="MiniSupermarket" <your_gmail_address@gmail.com>
APP_URL=http://localhost:3000
EMAIL_VERIFICATION_URL=http://localhost:3000/api/users/verify-email?token=
USER_URL=http://user-service:3001
```

> **How to get a Gmail App Password (required — normal password won't work):**
> 1. Go to your Google account at [myaccount.google.com](https://myaccount.google.com)
> 2. Go to **Security** → **2-Step Verification** → enable it if not already
> 3. Go to **Security** → **App passwords**
> 4. Create a new app password, name it "MiniSupermarket"
> 5. Copy the 16-character password (no spaces) into `MAIL_PASS`

> **If you don't want email right now:** Just put any placeholder values. Email features (verification, password reset) won't work, but everything else will.

### 2d. Inventory Service environment file

Create file: `be-e.commerce/services/inventoryServices/.env.docker`

```env
PORT=3003
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/ecommerce_inventory
REDIS_URL=redis://redis:6379
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
INTERNAL_SECRET=my_internal_secret_key
KAFKA_BROKER=kafka:29092
KAFKA_TOPIC=user-events
```

> **Cloudinary (for product images):** Sign up free at [cloudinary.com](https://cloudinary.com). After login, your Dashboard shows `Cloud Name`, `API Key`, and `API Secret`. Copy them in.
>
> **If you skip Cloudinary for now:** Products will work but image uploads won't. You can use direct image URLs instead.

### 2e. Activity Service environment file

Create file: `be-e.commerce/services/activityServices/.env.docker`

```env
PORT=3004
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/ecommerce_activity
REDIS_URL=redis://redis:6379
INTERNAL_SECRET=my_internal_secret_key
KAFKA_BROKER=kafka:29092
KAFKA_TOPIC=user-events
```

### 2f. Payment Service environment file

Create file: `be-e.commerce/services/paymentServices/.env.docker`

```env
PORT=3005
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/payment
INTERNAL_SECRET=my_internal_secret_key
PRODUCT_SERVICE_URL=http://inventory-service:3003
MOMO_ENDPOINT=https://test-payment.momo.vn
MOMO_CREATE_PATH=/v2/gateway/api/create
MOMO_PARTNER_CODE=MOMO_TEST
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_PARTNER_NAME=MiniSupermarket
MOMO_STORE_ID=MiniSupermarketStore
MOMO_REDIRECT_URL=http://localhost:3000/payment/momo/return
MOMO_IPN_URL=http://localhost:3000/api/payments/momo/ipn
MOMO_REQUEST_TYPE=captureWallet
MOMO_LANG=vi
MOMO_AUTO_CAPTURE=true
```

> **MoMo test credentials above are MoMo's public sandbox keys** — safe to use for testing. Real payments require registering a MoMo Business account.

### 2g. Promotion Service environment file

Create file: `be-e.commerce/services/promotionServices/.env.docker`

```env
PORT=3006
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/promotion
INTERNAL_SECRET=my_internal_secret_key
```

---

## Step 3 — Check the docker-compose.yml File

Open `be-e.commerce/docker-compose.yml` and check that each service points to the right `.env` file. Each service block should have an `env_file:` line referencing the `.env.docker` file you just created. If a service is missing one, the Claude integration guide has instructions for the next session.

---

## Step 4 — Start the Backend

Open a terminal, navigate to the `be-e.commerce/` folder:

```
cd be-e.commerce
docker-compose up --build
```

The first time this runs, Docker will:
1. Download all the images (MongoDB, Redis, Kafka, Node) — **this takes 5–15 minutes** depending on your internet
2. Build each service
3. Start everything together

You'll see a stream of logs. The backend is ready when you stop seeing new log lines and see messages like `Server running on port 300X`.

**To run in the background** (so you can close the terminal):
```
docker-compose up --build -d
```

**To stop everything:**
```
docker-compose down
```

**To stop and wipe all data (fresh start):**
```
docker-compose down -v
```

---

## Step 5 — Seed the Database (First Time Only)

The database starts empty. You need to run seed scripts to create the role types and a superadmin account.

> These commands run **inside** the Docker container. Open a new terminal while Docker is running.

### Seed roles (user, admin, seller, superadmin):
```
docker exec -it ecommerce-user-service npm run seed:roles
```

### Seed superadmin account:
```
docker exec -it ecommerce-user-service npm run seed:superadmin
```

> If the above `exec` commands don't work, check the container name with `docker ps` and replace `ecommerce-user-service` with the actual container name shown.

After seeding, there is one superadmin account. Check `be-e.commerce/services/userServices/src/scripts/` to find what email the superadmin seed uses, or look in the seed file directly.

---

## Step 6 — Verify Everything Works

Open your browser and go to:

- **Gateway health:** [http://localhost:3000/health](http://localhost:3000/health) → should return `{ status: "ok" }`
- **API docs (Swagger):** [http://localhost:3000/docs](http://localhost:3000/docs) → interactive API explorer
- **OpenAPI spec:** [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json)

If the gateway returns a response, the backend is running correctly.

---

## Step 7 — Set Up the Frontend

The frontend needs to know the backend URL. Create a file at `fe-e.commerce/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Then run the frontend in a separate terminal:
```
cd fe-e.commerce
npm install
npm run dev
```

Frontend will be at [http://localhost:3001](http://localhost:3001) (or 3000 if gateway is on a different port — check).

---

## Step 8 — Import the Postman Collection (Optional but Recommended)

There is a pre-built Postman collection for testing all backend endpoints:

1. Install **Postman** from [postman.com](https://www.postman.com/downloads/)
2. Open Postman → **Import** → select `be-e.commerce/ECommerce_API_Collection.postman_collection.json`
3. Set the variable `base_url` to `http://localhost:3000`
4. You can now test every API endpoint manually

---

## Troubleshooting

### "Port already in use" error
Another app is using port 3000. Either stop that app or change the gateway port in `docker-compose.yml` and the `.env.local` file.

### Services keep restarting
Check logs with: `docker-compose logs -f user-service` (replace with the failing service name). Usually a wrong `.env` value.

### MongoDB connection refused
Make sure the `mongodb` container is healthy before services start. Run `docker-compose ps` to see status. If MongoDB shows "starting" wait another minute.

### "Cannot find module" errors
The service may not have installed its packages. Run:
```
docker-compose up --build
```
The `--build` flag forces a rebuild.

### Docker Desktop is slow
Normal on first run. Once images are cached, subsequent starts take under a minute.

---

## Summary of Ports

| Service | URL |
|---------|-----|
| API Gateway (all requests) | http://localhost:3000 |
| Swagger API Docs | http://localhost:3000/docs |
| User Service | http://localhost:3001 |
| Mail Service | http://localhost:3002 |
| Inventory Service | http://localhost:3003 |
| Activity Service | http://localhost:3004 |
| Payment Service | http://localhost:3005 |
| Promotion Service | http://localhost:3006 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

> Always make requests through the Gateway (port 3000), not directly to services.

---

## What's Next

Once the backend is running, show this project to Claude with the file `INTEGRATION_GUIDE.md` — it contains a full plan for connecting each frontend page to the real backend APIs.
