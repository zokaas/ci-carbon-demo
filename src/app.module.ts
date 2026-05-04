import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { SeedModule } from './seed/seed.module';
import { Product } from './products/product.entity';
import { User } from './users/user.entity';
import { Order } from './orders/order.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Product, User, Order],
      synchronize: true,
      dropSchema: false,
    }),
    ProductsModule,
    UsersModule,
    OrdersModule,
    SeedModule,
  ],
})
export class AppModule {}
