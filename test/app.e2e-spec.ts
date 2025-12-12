import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('User Management API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let createdUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up database
    if (dataSource) {
      await dataSource.query('DELETE FROM user');
    }
    await app.close();
  });

  describe('POST /users - Create User', () => {
    it('should create a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phone: '+1234567890',
        })
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.firstName).toBe('John');
          expect(response.body.lastName).toBe('Doe');
          expect(response.body.email).toBe('john.doe@example.com');
          expect(response.body.phone).toBe('+1234567890');
          expect(response.body).not.toHaveProperty('password');
          createdUserId = response.body.id;
        });
    });

    it('should create user with optional middleName', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          firstName: 'Jane',
          middleName: 'Mary',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          password: 'password456',
          phone: '+1234567891',
        })
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body.middleName).toBe('Mary');
        });
    });

    it('should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          firstName: 'Duplicate',
          lastName: 'User',
          email: 'john.doe@example.com',
          password: 'password789',
          phone: '+1234567892',
        })
        .expect(HttpStatus.CONFLICT)
        .then((response) => {
          expect(response.body.message).toContain('already exists');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          firstName: 'Invalid',
          lastName: 'Email',
          email: 'not-an-email',
          password: 'password123',
          phone: '+1234567893',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          firstName: 'Short',
          lastName: 'Pass',
          email: 'short@example.com',
          password: '12345',
          phone: '+1234567894',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          firstName: 'Missing',
          // Missing lastName, email, password, phone
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid phone number', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          firstName: 'Invalid',
          lastName: 'Phone',
          email: 'invalid.phone@example.com',
          password: 'password123',
          phone: 'not-a-phone',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject non-whitelisted properties', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          firstName: 'Extra',
          lastName: 'Field',
          email: 'extra@example.com',
          password: 'password123',
          phone: '+1234567895',
          maliciousField: 'should be rejected',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /users - List Users', () => {
    it('should return list of users with pagination', () => {
      return request(app.getHttpServer())
        .get('/users')
        .query({ skip: 0, limit: 10, order: 'asc' })
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it('should return users with default pagination', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('should support descending order', () => {
      return request(app.getHttpServer())
        .get('/users')
        .query({ order: 'desc' })
        .expect(HttpStatus.OK);
    });
  });

  describe('GET /users/:id - Get Single User', () => {
    it('should return a specific user by id', () => {
      return request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.id).toBe(createdUserId);
          expect(response.body.firstName).toBe('John');
          expect(response.body.email).toBe('john.doe@example.com');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/users/99999')
        .expect(HttpStatus.NOT_FOUND)
        .then((response) => {
          expect(response.body.message).toContain('not found');
        });
    });

    it('should fail with invalid id format', () => {
      return request(app.getHttpServer())
        .get('/users/invalid-id')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('PATCH /users/:id - Update User', () => {
    it('should update user successfully', () => {
      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .send({
          firstName: 'John Updated',
          lastName: 'Doe Updated',
        })
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.firstName).toBe('John Updated');
          expect(response.body.lastName).toBe('Doe Updated');
          expect(response.body.email).toBe('john.doe@example.com');
        });
    });

    it('should allow partial updates', () => {
      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .send({
          firstName: 'Partial Update',
        })
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.firstName).toBe('Partial Update');
        });
    });

    it('should return 404 when updating non-existent user', () => {
      return request(app.getHttpServer())
        .patch('/users/99999')
        .send({
          firstName: 'Should Fail',
        })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail when updating to existing email', () => {
      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .send({
          email: 'jane.smith@example.com', // Already exists
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('should validate updated fields', () => {
      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .send({
          email: 'not-an-email',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject non-whitelisted update fields', () => {
      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .send({
          firstName: 'Valid',
          unauthorizedField: 'Should be rejected',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /users/:id - Delete User', () => {
    let userToDeleteId: number;

    beforeAll(async () => {
      // Create a user specifically for deletion
      const response = await request(app.getHttpServer()).post('/users').send({
        firstName: 'To Delete',
        lastName: 'User',
        email: 'to.delete@example.com',
        password: 'password123',
        phone: '+1234567896',
      });
      userToDeleteId = response.body.id;
    });

    it('should delete user successfully (soft delete)', () => {
      return request(app.getHttpServer())
        .delete(`/users/${userToDeleteId}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return 404 after deletion', () => {
      return request(app.getHttpServer())
        .get(`/users/${userToDeleteId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 404 when deleting non-existent user', () => {
      return request(app.getHttpServer())
        .delete('/users/99999')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail with invalid id format', () => {
      return request(app.getHttpServer())
        .delete('/users/invalid-id')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Cache Behavior', () => {
    it('should cache user data on subsequent requests', async () => {
      // First request - should hit database
      const response1 = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(HttpStatus.OK);

      // Second request - should hit cache
      const response2 = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(HttpStatus.OK);

      expect(response1.body).toEqual(response2.body);
    });
  });

  describe('Complete User Workflow', () => {
    it('should complete full CRUD cycle successfully', async () => {
      // Create
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          firstName: 'Workflow',
          lastName: 'Test',
          email: 'workflow@example.com',
          password: 'password123',
          phone: '+1234567897',
        })
        .expect(HttpStatus.CREATED);

      const userId = createResponse.body.id;

      // Read
      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(HttpStatus.OK);

      // Update
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({ firstName: 'Updated Workflow' })
        .expect(HttpStatus.OK);

      // Delete
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
