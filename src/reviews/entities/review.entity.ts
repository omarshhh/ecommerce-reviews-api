import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('reviews')
@Unique(['user', 'product', 'order'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text' })
  comment!: string;

  @Column({ default: false })
  isHidden!: boolean;

  @Column({ type: 'text', nullable: true })
  hiddenReason!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  hiddenAt!: Date | null;

  @ManyToOne(() => User, (user: User) => user.reviews)
  user!: User;

  @ManyToOne(() => Product, (product: Product) => product.reviews)
  product!: Product;

  @ManyToOne(() => Order, (order: Order) => order.reviews)
  order!: Order;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
