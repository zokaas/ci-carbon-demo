import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';

const mockService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useFactory: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return result', async () => {
      const dto = { name: 'Alice', email: 'alice@example.com' };
      const user = { id: 1, ...dto } as User;
      service.create.mockResolvedValue(user);

      const result = await controller.create(dto);
      expect(result).toEqual(user);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ id: 1 }] as User[];
      service.findAll.mockResolvedValue(users);

      const result = await controller.findAll();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return one user', async () => {
      const user = { id: 1 } as User;
      service.findOne.mockResolvedValue(user);

      const result = await controller.findOne(1);
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should update and return user', async () => {
      const user = { id: 1, name: 'Updated' } as User;
      service.update.mockResolvedValue(user);

      const result = await controller.update(1, { name: 'Updated' });
      expect(result).toEqual(user);
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
