import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';

const mockService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useFactory: mockService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return result', async () => {
      const dto = { name: 'Test', price: 10, stock: 5 };
      const product = { id: 1, ...dto } as Product;
      service.create.mockResolvedValue(product);

      const result = await controller.create(dto);
      expect(result).toEqual(product);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const products = [{ id: 1 }] as Product[];
      service.findAll.mockResolvedValue(products);

      const result = await controller.findAll();
      expect(result).toEqual(products);
    });
  });

  describe('findOne', () => {
    it('should return one product', async () => {
      const product = { id: 1 } as Product;
      service.findOne.mockResolvedValue(product);

      const result = await controller.findOne(1);
      expect(result).toEqual(product);
    });
  });

  describe('update', () => {
    it('should update and return product', async () => {
      const product = { id: 1, name: 'Updated' } as Product;
      service.update.mockResolvedValue(product);

      const result = await controller.update(1, { name: 'Updated' });
      expect(result).toEqual(product);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      service.remove.mockResolvedValue(undefined);

      await expect(controller.remove(1)).resolves.toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
