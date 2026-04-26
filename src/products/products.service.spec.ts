import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { NotFoundException } from '@nestjs/common';

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
});

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: jest.Mocked<Repository<Product>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: getRepositoryToken(Product), useFactory: mockRepo }],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repo = module.get(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a product', async () => {
      const dto = { name: 'Test', price: 10, stock: 5 };
      const product = { id: 1, ...dto } as Product;
      repo.create.mockReturnValue(product);
      repo.save.mockResolvedValue(product);
      const result = await service.create(dto);
      expect(result).toEqual(product);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(product);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const products = [{ id: 1, name: 'A' }] as Product[];
      repo.find.mockResolvedValue(products);
      const result = await service.findAll();
      expect(result).toEqual(products);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const product = { id: 1, name: 'A' } as Product;
      repo.findOneBy.mockResolvedValue(product);
      const result = await service.findOne(1);
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return a product', async () => {
      const product = { id: 1, name: 'Old', price: 5, stock: 0 } as Product;
      repo.findOneBy.mockResolvedValue(product);
      repo.save.mockResolvedValue({ ...product, name: 'New' });
      const result = await service.update(1, { name: 'New' });
      expect(result.name).toBe('New');
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const product = { id: 1 } as Product;
      repo.findOneBy.mockResolvedValue(product);
      repo.remove.mockResolvedValue(product);
      await expect(service.remove(1)).resolves.toBeUndefined();
    });
  });
});
