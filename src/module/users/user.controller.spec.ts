import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserNotFoundException } from 'src/common/exceptions/user-not-found.exception';
import { DuplicateEmailException } from 'src/common/exceptions/duplicate-email.exception';

describe('UsersController', () => {
  let controller: UsersController;
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

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      const pagination: PaginationDto = { skip: 0, limit: 20, order: 'asc' };

      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.getUsers(pagination);

      expect(result).toEqual(users);
      expect(service.findAll).toHaveBeenCalledWith(pagination);
    });

    it('should return empty array when no users exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await controller.getUsers({
        skip: 0,
        limit: 20,
        order: 'asc',
      });

      expect(result).toEqual([]);
    });
  });

  describe('getUser', () => {
    it('should return a single user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getUser(1);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw UserNotFoundException when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(
        new UserNotFoundException(999),
      );

      await expect(controller.getUser(999)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      firstName: 'Jane',
      middleName: 'M',
      lastName: 'Smith',
      email: 'jane@example.com',
      password: 'password123',
      phone: '+1234567891',
    };

    it('should create a new user', async () => {
      const newUser = { ...mockUser, ...createUserDto, id: 2 };
      mockUsersService.create.mockResolvedValue(newUser);

      const result = await controller.createUser(createUserDto);

      expect(result).toEqual(newUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw DuplicateEmailException when email exists', async () => {
      mockUsersService.create.mockRejectedValue(
        new DuplicateEmailException(createUserDto.email),
      );

      await expect(controller.createUser(createUserDto)).rejects.toThrow(
        DuplicateEmailException,
      );
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update a user', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(1, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(1, updateUserDto);
    });

    it('should throw UserNotFoundException when user not found', async () => {
      mockUsersService.update.mockRejectedValue(new UserNotFoundException(999));

      await expect(controller.updateUser(999, updateUserDto)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should allow partial updates', async () => {
      const partialUpdate: UpdateUserDto = { firstName: 'NewName' };
      const updatedUser = { ...mockUser, firstName: 'NewName' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(1, partialUpdate);

      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.deleteUser(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw UserNotFoundException when user not found', async () => {
      mockUsersService.remove.mockRejectedValue(new UserNotFoundException(999));

      await expect(controller.deleteUser(999)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });
});
