import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { NotFoundException } from '@nestjs/common';

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let repo: jest.Mocked<Repository<Order>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, { provide: getRepositoryToken(Order), useFactory: mockRepo }],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    repo = module.get(getRepositoryToken(Order));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save an order', async () => {
      const dto = { userId: 1, productId: 1, quantity: 2 };
      const order = { id: 1, ...dto, status: 'pending' } as Order;
      repo.create.mockReturnValue(order);
      repo.save.mockResolvedValue(order);
      expect(await service.create(dto)).toEqual(order);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const orders = [{ id: 1 }] as Order[];
      repo.find.mockResolvedValue(orders);
      expect(await service.findAll()).toEqual(orders);
    });
  });

  describe('findOne', () => {
    it('should return an order', async () => {
      const order = { id: 1 } as Order;
      repo.findOneBy.mockResolvedValue(order);
      expect(await service.findOne(1)).toEqual(order);
    });

    it('should throw if not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an order', async () => {
      const order = { id: 1, status: 'pending' } as Order;
      repo.findOneBy.mockResolvedValue(order);
      repo.save.mockResolvedValue({ ...order, status: 'confirmed' });
      const result = await service.update(1, { status: 'confirmed' });
      expect(result.status).toBe('confirmed');
    });
  });

  describe('remove', () => {
    it('should remove an order', async () => {
      const order = { id: 1 } as Order;
      repo.findOneBy.mockResolvedValue(order);
      repo.remove.mockResolvedValue(order);
      await expect(service.remove(1)).resolves.toBeUndefined();
    });
  });
});
