# 🐳 Docker Setup - Run All Services

## Yêu cầu

- Docker Desktop cài đặt
- Docker Compose v2+

## 🚀 Chạy toàn bộ ứng dụng (Container)

### Từ thư mục gốc:

```bash
# Xóa containers cũ (nếu có)
docker-compose down

# Build và khởi động tất cả services
docker-compose up --build

# Nếu chỉ muốn chạy (không rebuild):
docker-compose up
```

### Chạy ở chế độ background:

```bash
docker-compose up -d
```

### Kiểm tra logs:

```bash
# Tất cả services
docker-compose logs -f

# Cụ thể một service
docker-compose logs -f gateway
docker-compose logs -f userServices
docker-compose logs -f inventoryServices
docker-compose logs -f activityServices
docker-compose logs -f mailServices
```

## 📋 Các Services trong Stack

| Service               | Port  | Database | Mô tả              |
| --------------------- | ----- | -------- | ------------------ |
| **Gateway**           | 3000  | -        | API Gateway        |
| **User Service**      | 3001  | MongoDB  | Quản lý Users      |
| **Inventory Service** | 3003  | MongoDB  | Quản lý Products   |
| **Activity Service**  | 3004  | MongoDB  | Quản lý Activities |
| **Mail Service**      | 3002  | -        | Gửi Email          |
| **MongoDB**           | 27017 | -        | Database           |
| **Redis**             | 6379  | -        | Cache              |
| **Kafka**             | 9092  | -        | Message Queue      |

## ✅ Kiểm tra các services

```bash
# Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health

# Product Service
curl http://localhost:3003/health

# Activity Service
curl http://localhost:3004/health
```

## 🧹 Dọn dẹp

```bash
# Dừng tất cả services
docker-compose down

# Xóa tất cả containers, networks, volumes
docker-compose down -v

# Xóa images
docker-compose down --rmi all
```

## 🐛 Troubleshooting

### Nếu gặp lỗi port đang dùng:

```bash
# Kiểm tra process đang chiếm port
lsof -i :3000  # trên macOS/Linux
netstat -ano | findstr :3000  # trên Windows

# Kill process (macOS/Linux)
kill -9 <PID>
```

### Nếu Redis/MongoDB không kết nối:

```bash
# Kiểm tra trạng thái containers
docker-compose ps

# Xem logs của service cụ thể
docker-compose logs mongodb
docker-compose logs redis
docker-compose logs kafka
```

### Rebuild all images:

```bash
docker-compose build --no-cache
docker-compose up
```

## 📝 Environment Variables

Các `.env.docker` files đã được cấu hình cho Docker:

- `gateway/.env.docker`
- `services/userServices/.env.docker`
- `services/inventoryServices/.env.docker`
- `services/activityServices/.env.docker`
- `services/paymentServices/.env.docker`
- `services/mailServices/.env.docker`

Để sửa đổi, edit các files này trước khi chạy `docker-compose up`.

## 🎯 Chạy từng service riêng (nếu cần)

```bash
# Chạy riêng a service folder
cd services/activityServices
docker-compose up

# Nhưng cần cấu hình networking để kết nối với services khác
```

## 💾 Persistent Data

Volumes được tạo tự động:

- `mongo-data` - lưu MongoDB data
- Kafka/Zookeeper - tự động tạo

Để xóa volumes:

```bash
docker-compose down -v
```
