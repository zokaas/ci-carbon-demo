import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
  ) {}

  create(dto: CreateOrderDto): Promise<Order> {
    const order = this.repo.create(dto);
    return this.repo.save(order);
  }

  findAll(): Promise<Order[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.repo.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, dto);
    return this.repo.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.repo.remove(order);
  }

  saveMany(orders: Partial<Order>[]): Promise<Order[]> {
    return this.repo.save(orders as Order[]);
  }
}
// docker-sim commit 3 - Sat May  9 14:34:24 EEST 2026
// docker-sim commit 6 - Sat May  9 14:46:28 EEST 2026
// docker-sim commit 9 - Sat May  9 14:58:32 EEST 2026
// docker-sim commit 12 - Sat May  9 15:10:37 EEST 2026
// docker-sim commit 15 - Sat May  9 15:22:41 EEST 2026
// docker-sim commit 18 - Sat May  9 15:34:46 EEST 2026
// docker-sim commit 21 - Sat May  9 15:46:50 EEST 2026
// docker-sim commit 24 - Sat May  9 15:58:54 EEST 2026
// docker-sim commit 27 - Sat May  9 16:10:59 EEST 2026
