import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @OneToMany(() => OrderItem, (orderItem: OrderItem) => orderItem.product)
  orderItems!: OrderItem[];

  @OneToMany(() => Review, (review: Review) => review.product)
  reviews!: Review[];
}
