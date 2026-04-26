import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useFactory: mockRepo }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a user', async () => {
      const dto = { name: 'Alice', email: 'alice@example.com' };
      const user = { id: 1, ...dto } as User;
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);
      const result = await service.create(dto);
      expect(result).toEqual(user);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ id: 1 }] as User[];
      repo.find.mockResolvedValue(users);
      expect(await service.findAll()).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = { id: 1 } as User;
      repo.findOneBy.mockResolvedValue(user);
      expect(await service.findOne(1)).toEqual(user);
    });

    it('should throw if not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const user = { id: 1, name: 'Old', email: 'old@example.com' } as User;
      repo.findOneBy.mockResolvedValue(user);
      repo.save.mockResolvedValue({ ...user, name: 'New' });
      const result = await service.update(1, { name: 'New' });
      expect(result.name).toBe('New');
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const user = { id: 1 } as User;
      repo.findOneBy.mockResolvedValue(user);
      repo.remove.mockResolvedValue(user);
      await expect(service.remove(1)).resolves.toBeUndefined();
    });
  });
});
