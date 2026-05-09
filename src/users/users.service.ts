import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  create(dto: CreateUserDto): Promise<User> {
    const user = this.repo.create(dto);
    return this.repo.save(user);
  }

  findAll(): Promise<User[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.repo.remove(user);
  }

  saveMany(users: Partial<User>[]): Promise<User[]> {
    return this.repo.save(users as User[]);
  }
}
// docker-sim commit 2 - Sat May  9 14:30:22 EEST 2026
// docker-sim commit 5 - Sat May  9 14:42:27 EEST 2026
// docker-sim commit 8 - Sat May  9 14:54:31 EEST 2026
// docker-sim commit 11 - Sat May  9 15:06:35 EEST 2026
// docker-sim commit 14 - Sat May  9 15:18:40 EEST 2026
// docker-sim commit 17 - Sat May  9 15:30:44 EEST 2026
// docker-sim commit 20 - Sat May  9 15:42:49 EEST 2026
