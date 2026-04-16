-- Создание базы данных
CREATE DATABASE IF NOT EXISTS promocode_analytics;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS promocode_analytics.users (
    id String,
    email String,
    name String,
    phone String,
    isActive UInt8,
    createdAt DateTime,
    updatedAt DateTime
) ENGINE = MergeTree()
ORDER BY (createdAt, id);

-- Таблица промокодов
CREATE TABLE IF NOT EXISTS promocode_analytics.promocodes (
    id String,
    code String,
    discount Float32,
    totalLimit Int32,
    userLimit Int32,
    dateFrom Nullable(DateTime),
    dateTo Nullable(DateTime),
    isActive UInt8,
    createdAt DateTime,
    updatedAt DateTime
) ENGINE = MergeTree()
ORDER BY (createdAt, id);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS promocode_analytics.orders (
    id String,
    userId String,
    userName String,
    userEmail String,
    amount Float32,
    discount Float32,
    finalAmount Float32,
    promocodeId Nullable(String),
    promocodeCode Nullable(String),
    createdAt DateTime,
    updatedAt DateTime
) ENGINE = MergeTree()
ORDER BY (createdAt, id);

-- Таблица использований промокодов
CREATE TABLE IF NOT EXISTS promocode_analytics.promo_usages (
    id String,
    promocodeId String,
    promocodeCode String,
    promocodeDiscount Float32,
    userId String,
    userName String,
    userEmail String,
    orderId String,
    orderAmount Float32,
    discountAmount Float32,
    createdAt DateTime
) ENGINE = MergeTree()
ORDER BY (createdAt, id);
