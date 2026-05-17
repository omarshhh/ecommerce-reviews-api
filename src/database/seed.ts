import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Review } from '../reviews/entities/review.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ecommerce_reviews',
  entities: [User, Product, Order, OrderItem, Review],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const productRepository = AppDataSource.getRepository(Product);
  const orderRepository = AppDataSource.getRepository(Order);
  const orderItemRepository = AppDataSource.getRepository(OrderItem);

  await AppDataSource.query(`
    TRUNCATE TABLE
      reviews,
      order_items,
      orders,
      products,
      users
    RESTART IDENTITY CASCADE;
  `);

  const hashedPassword = await bcrypt.hash('123456', 10);

  const omar = userRepository.create({
    name: 'Omar',
    email: 'omar@test.com',
    password: hashedPassword,
    role: UserRole.CUSTOMER,
  });

  const sara = userRepository.create({
    name: 'Sara',
    email: 'sara@test.com',
    password: hashedPassword,
    role: UserRole.CUSTOMER,
  });

  const admin = userRepository.create({
    name: 'Admin',
    email: 'admin@test.com',
    password: hashedPassword,
    role: UserRole.ADMIN,
  });

  await userRepository.save([omar, sara, admin]);

  const iphone = productRepository.create({
    name: 'iPhone',
  });

  const keyboard = productRepository.create({
    name: 'Keyboard',
  });

  await productRepository.save([iphone, keyboard]);

  const omarDeliveredOrder = orderRepository.create({
    user: omar,
    status: OrderStatus.DELIVERED,
  });

  const omarPendingOrder = orderRepository.create({
    user: omar,
    status: OrderStatus.PENDING,
  });

  const saraDeliveredOrder = orderRepository.create({
    user: sara,
    status: OrderStatus.DELIVERED,
  });

  await orderRepository.save([
    omarDeliveredOrder,
    omarPendingOrder,
    saraDeliveredOrder,
  ]);

  const omarDeliveredOrderItem = orderItemRepository.create({
    order: omarDeliveredOrder,
    product: iphone,
    quantity: 1,
  });

  const omarPendingOrderItem = orderItemRepository.create({
    order: omarPendingOrder,
    product: keyboard,
    quantity: 1,
  });

  const saraDeliveredOrderItem = orderItemRepository.create({
    order: saraDeliveredOrder,
    product: keyboard,
    quantity: 1,
  });

  await orderItemRepository.save([
    omarDeliveredOrderItem,
    omarPendingOrderItem,
    saraDeliveredOrderItem,
  ]);

  console.log('Seed completed successfully');
  console.log({
    users: {
      omar: {
        email: 'omar@test.com',
        password: '123456',
      },
      sara: {
        email: 'sara@test.com',
        password: '123456',
      },
      admin: {
        email: 'admin@test.com',
        password: '123456',
      },
    },
    products: {
      iphoneId: iphone.id,
      keyboardId: keyboard.id,
    },
    orders: {
      omarDeliveredOrderId: omarDeliveredOrder.id,
      omarPendingOrderId: omarPendingOrder.id,
      saraDeliveredOrderId: saraDeliveredOrder.id,
    },
  });

  await AppDataSource.destroy();
}

seed().catch(async (error) => {
  console.error(error);
  await AppDataSource.destroy();
});
