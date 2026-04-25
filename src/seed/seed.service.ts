import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

  async seed(count = 1000): Promise<void> {
    // Tuotteet
    const products = Array.from({ length: count }, (_, i) => ({
      name: `Product ${i + 1}`,
      price: Number((Math.random() * 100 + 1).toFixed(2)),
      stock: Math.floor(Math.random() * 500),
    }));
    const savedProducts = await this.productsService.saveMany(products);

    // Käyttäjät
    const users = Array.from({ length: count }, (_, i) => ({
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    }));
    const savedUsers = await this.usersService.saveMany(users);

    // Tilaukset
    const orders = Array.from({ length: count }, (_, i) => ({
      userId: savedUsers[i % savedUsers.length].id,
      productId: savedProducts[i % savedProducts.length].id,
      quantity: Math.floor(Math.random() * 5) + 1,
      status: 'pending' as const,
    }));
    await this.ordersService.saveMany(orders);
  }
}
