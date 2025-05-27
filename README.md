# Installation Guide

## Docker Compose Commands

### To deploy using Docker:

Start services:

```bash
sudo docker-compose up
```

Start services with build:

```bash
sudo docker-compose up --build
```

Stop services:

```bash
sudo docker-compose down
```

Stop services and remove volumes:

```bash
sudo docker-compose down -v
```

## PostgreSQL Setup Commands

### To run locally for development purposes:

```bash
sudo pacman -S postgresql
sudo -u postgres initdb -D /var/lib/postgres/data
sudo systemctl start postgresql
psql -U postgres

CREATE USER example_user WITH PASSWORD 'example_passwd';
CREATE DATABASE example_db WITH OWNER example_user;
GRANT ALL PRIVILEGES ON DATABASE example_db TO example_user;
\q

psql -d example_db -U example_user
```