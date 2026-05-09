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
// sim commit 2 - Sat May  9 12:36:30 EEST 2026
// sim commit 5 - Sat May  9 12:42:34 EEST 2026
// sim commit 8 - Sat May  9 12:48:38 EEST 2026
// sim commit 11 - Sat May  9 12:54:43 EEST 2026
// sim commit 14 - Sat May  9 13:00:47 EEST 2026
// sim commit 17 - Sat May  9 13:06:52 EEST 2026
// sim commit 20 - Sat May  9 13:12:56 EEST 2026
// sim commit 23 - Sat May  9 13:19:00 EEST 2026
// sim commit 26 - Sat May  9 13:25:05 EEST 2026
// sim commit 29 - Sat May  9 13:31:09 EEST 2026
// sim commit 32 - Sat May  9 13:37:13 EEST 2026
