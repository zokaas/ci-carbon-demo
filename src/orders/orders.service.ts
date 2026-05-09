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
// sim commit 3 - Sat May  9 12:38:31 EEST 2026
// sim commit 6 - Sat May  9 12:44:35 EEST 2026
// sim commit 9 - Sat May  9 12:50:40 EEST 2026
// sim commit 12 - Sat May  9 12:56:44 EEST 2026
// sim commit 15 - Sat May  9 13:02:49 EEST 2026
// sim commit 18 - Sat May  9 13:08:53 EEST 2026
