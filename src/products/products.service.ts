import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  create(dto: CreateProductDto): Promise<Product> {
    const product = this.repo.create(dto);
    return this.repo.save(product);
  }

  findAll(): Promise<Product[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.repo.findOneBy({ id });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.repo.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.repo.remove(product);
  }

  saveMany(products: Partial<Product>[]): Promise<Product[]> {
    return this.repo.save(products as Product[]);
  }
}
// docker-sim commit 1 - Sat May  9 14:26:21 EEST 2026
// docker-sim commit 4 - Sat May  9 14:38:25 EEST 2026
// docker-sim commit 7 - Sat May  9 14:50:30 EEST 2026
// docker-sim commit 10 - Sat May  9 15:02:34 EEST 2026
// docker-sim commit 13 - Sat May  9 15:14:38 EEST 2026
// docker-sim commit 16 - Sat May  9 15:26:42 EEST 2026
// docker-sim commit 19 - Sat May  9 15:38:47 EEST 2026
// docker-sim commit 22 - Sat May  9 15:50:51 EEST 2026
// docker-sim commit 25 - Sat May  9 16:02:56 EEST 2026
// docker-sim commit 28 - Sat May  9 16:15:00 EEST 2026
// docker-sim commit 31 - Sat May  9 16:27:04 EEST 2026
