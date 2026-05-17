import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @ManyToOne(() => Order, (order: Order) => order.items)
  order!: Order;

  @ManyToOne(() => Product, (product: Product) => product.orderItems)
  product!: Product;
}
