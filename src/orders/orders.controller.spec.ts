import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';

const mockService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: jest.Mocked<OrdersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useFactory: mockService }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return result', async () => {
      const dto = { userId: 1, productId: 1, quantity: 2 };
      const order = { id: 1, ...dto, status: 'pending' } as Order;
      service.create.mockResolvedValue(order);

      const result = await controller.create(dto);
      expect(result).toEqual(order);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const orders = [{ id: 1 }] as Order[];
      service.findAll.mockResolvedValue(orders);

      const result = await controller.findAll();
      expect(result).toEqual(orders);
    });
  });

  describe('findOne', () => {
    it('should return one order', async () => {
      const order = { id: 1 } as Order;
      service.findOne.mockResolvedValue(order);

      const result = await controller.findOne(1);
      expect(result).toEqual(order);
    });
  });

  describe('update', () => {
    it('should update and return order', async () => {
      const order = { id: 1, status: 'confirmed' } as Order;
      service.update.mockResolvedValue(order);

      const result = await controller.update(1, { status: 'confirmed' });
      expect(result).toEqual(order);
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
