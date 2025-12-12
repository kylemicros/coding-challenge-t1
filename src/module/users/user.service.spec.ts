import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UsersService } from './user.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserNotFoundException } from 'src/common/exceptions/user-not-found.exception';
import { DuplicateEmailException } from 'src/common/exceptions/duplicate-email.exception';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 1,
    firstName: 'John',
    middleName: null as string | null,
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    phone: '+1234567890',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as Date | null,
    hashPassword: jest.fn(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return cached users if cache exists', async () => {
      const pagination: PaginationDto = { skip: 0, limit: 20, order: 'asc' };
      const cachedUsers = [mockUser];

      mockCacheManager.get.mockResolvedValue(cachedUsers);

      const result = await service.findAll(pagination);

      expect(result).toEqual(cachedUsers);
      expect(mockCacheManager.get).toHaveBeenCalledWith('users:page:0:20:asc');
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if no cache exists', async () => {
      const pagination: PaginationDto = { skip: 0, limit: 20, order: 'asc' };
      const users = [mockUser];

      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll(pagination);

      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        order: { id: 'ASC' },
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'users:page:0:20:asc',
        users,
      );
    });

    it('should handle descending order', async () => {
      const pagination: PaginationDto = { skip: 10, limit: 5, order: 'desc' };
      const users = [mockUser];

      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(users);

      await service.findAll(pagination);

      expect(mockRepository.find).toHaveBeenCalledWith({
        skip: 10,
        take: 5,
        order: { id: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return cached user if cache exists', async () => {
      mockCacheManager.get.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUser);
      expect(mockCacheManager.get).toHaveBeenCalledWith('user:1');
      expect(mockRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if no cache exists', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockCacheManager.set).toHaveBeenCalledWith('user:1', mockUser);
    });

    it('should throw UserNotFoundException if user not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      firstName: 'Jane',
      middleName: 'M',
      lastName: 'Smith',
      email: 'jane@example.com',
      password: 'password123',
      phone: '+1234567891',
    };

    it('should create a new user successfully', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw DuplicateEmailException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        DuplicateEmailException,
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockCacheManager.del).toHaveBeenCalledWith('user:1');
    });

    it('should throw UserNotFoundException if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(999, updateUserDto)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should throw DuplicateEmailException if updating to existing email', async () => {
      const updateWithEmail: UpdateUserDto = {
        email: 'existing@example.com',
      };
      const existingUser = {
        ...mockUser,
        id: 2,
        email: 'existing@example.com',
      };

      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.update(1, updateWithEmail)).rejects.toThrow(
        DuplicateEmailException,
      );
    });

    it('should allow updating to same email', async () => {
      const updateWithSameEmail: UpdateUserDto = {
        email: mockUser.email,
      };

      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.update(1, updateWithSameEmail);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(mockRepository.softDelete).toHaveBeenCalledWith(1);
      expect(mockCacheManager.del).toHaveBeenCalledWith('user:1');
    });

    it('should throw UserNotFoundException if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(UserNotFoundException);
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
