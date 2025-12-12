import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  // Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './user.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // @Patch(':id')
  // updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  //   return this.usersService.update(+id, dto);
  // }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
