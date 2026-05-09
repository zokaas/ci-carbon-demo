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
// sim commit 1 - Sat May  9 12:34:28 EEST 2026
// sim commit 4 - Sat May  9 12:40:33 EEST 2026
// sim commit 7 - Sat May  9 12:46:37 EEST 2026
// sim commit 10 - Sat May  9 12:52:41 EEST 2026
// sim commit 13 - Sat May  9 12:58:46 EEST 2026
// sim commit 16 - Sat May  9 13:04:50 EEST 2026
// sim commit 19 - Sat May  9 13:10:55 EEST 2026
// sim commit 22 - Sat May  9 13:16:59 EEST 2026
// sim commit 25 - Sat May  9 13:23:03 EEST 2026
// sim commit 28 - Sat May  9 13:29:08 EEST 2026
// sim commit 31 - Sat May  9 13:35:12 EEST 2026
// sim commit 34 - Sat May  9 13:41:16 EEST 2026
