import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserNotFoundException } from 'src/common/exceptions/user-not-found.exception';
import { DuplicateEmailException } from 'src/common/exceptions/duplicate-email.exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async findAll(pagination: PaginationDto): Promise<User[]> {
    const cacheKey = `users:page:${pagination.skip}:${pagination.limit}:${pagination.order}`;
    const cached = await this.cacheManager.get<User[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const users = await this.userRepository.find({
      skip: pagination.skip,
      take: pagination.limit,
      order: {
        id: (pagination.order || 'asc').toUpperCase() as 'ASC' | 'DESC',
      },
    });

    await this.cacheManager.set(cacheKey, users);
    return users;
  }

  async findOne(id: number): Promise<User> {
    const cacheKey = `user:${id}`;
    const cached = await this.cacheManager.get<User>(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new UserNotFoundException(id);
    }

    await this.cacheManager.set(cacheKey, user);
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new DuplicateEmailException(dto.email);
    }

    const user = this.userRepository.create(dto);
    const savedUser = await this.userRepository.save(user);

    // Invalidate list cache
    await this.clearListCache();

    return savedUser;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new UserNotFoundException(id);
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new DuplicateEmailException(dto.email);
      }
    }

    Object.assign(user, dto);
    const updatedUser = await this.userRepository.save(user);

    // Clear cache for this user and list cache
    await this.cacheManager.del(`user:${id}`);
    await this.clearListCache();

    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new UserNotFoundException(id);
    }

    await this.userRepository.softDelete(id);

    // Clear cache for this user and list cache
    await this.cacheManager.del(`user:${id}`);
    await this.clearListCache();
  }

  private async clearListCache(): Promise<void> {
    // Cache-manager (via Keyv) doesn't natively support pattern-based deletion
    // like Redis SCAN/DEL commands (e.g., "users:page:*")
    //
    // Current behavior: List caches expire naturally after TTL (5 minutes)
    //
    // Future improvements could include:
    // 1. Maintain a Set of cache keys and delete them individually
    // 2. Use Redis client directly for pattern matching
    // 3. Implement cache tagging with keyv-cache-manager
    //
    // For this microservice, TTL-based expiration is acceptable
    // as user list changes are not extremely time-sensitive
  }
}
