import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { SeedService } from './seed.service';

@Module({
  imports: [ProductsModule, UsersModule, OrdersModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
