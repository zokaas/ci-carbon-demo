import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: false, nullable: false })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Product, { eager: false, nullable: false })
  product: Product;

  @Column()
  productId: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ default: 'pending' })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;
}
