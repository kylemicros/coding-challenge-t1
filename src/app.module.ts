import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UsersModule } from './module/users/user.module';
import { User } from './module/users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'user_management',
      entities: [User],
      cache: true,
      synchronize: true, // Note: set to false in production
    }),
    UsersModule,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
