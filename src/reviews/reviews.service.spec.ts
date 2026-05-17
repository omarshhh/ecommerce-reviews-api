import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

type MockRepository<T = unknown> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <T = unknown>(): MockRepository<T> => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: MockRepository<Review>;
  let userRepository: MockRepository<User>;
  let productRepository: MockRepository<Product>;
  let orderRepository: MockRepository<Order>;
  let orderItemRepository: MockRepository<OrderItem>;

  const userId = 'user-id';
  const productId = 'product-id';
  const orderId = 'order-id';

  const user: User = {
    id: userId,
    name: 'Omar',
    email: 'omar@test.com',
    password: 'hashed-password',
    role: UserRole.CUSTOMER,
    orders: [],
    reviews: [],
  };

  const product: Product = {
    id: productId,
    name: 'iPhone',
    orderItems: [],
    reviews: [],
  };

  const order: Order = {
    id: orderId,
    status: OrderStatus.DELIVERED,
    user,
    items: [],
    reviews: [],
  };

  const orderItem: OrderItem = {
    id: 'order-item-id',
    quantity: 1,
    order,
    product,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: createMockRepository<Review>(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository<User>(),
        },
        {
          provide: getRepositoryToken(Product),
          useValue: createMockRepository<Product>(),
        },
        {
          provide: getRepositoryToken(Order),
          useValue: createMockRepository<Order>(),
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: createMockRepository<OrderItem>(),
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewRepository = module.get(getRepositoryToken(Review));
    userRepository = module.get(getRepositoryToken(User));
    productRepository = module.get(getRepositoryToken(Product));
    orderRepository = module.get(getRepositoryToken(Order));
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReview', () => {
    const createReviewDto = {
      productId,
      orderId,
      rating: 5,
      comment: 'Amazing phone',
    };

    it('should create a review successfully', async () => {
      const savedReview: Review = {
        id: 'review-id',
        rating: 5,
        comment: 'Amazing phone',
        isHidden: false,
        hiddenReason: null,
        hiddenAt: null,
        user,
        product,
        order,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      productRepository.findOne!.mockResolvedValue(product);
      orderRepository.findOne!.mockResolvedValue(order);
      orderItemRepository.findOne!.mockResolvedValue(orderItem);
      reviewRepository.findOne!.mockResolvedValue(null);
      userRepository.findOne!.mockResolvedValue(user);
      reviewRepository.create!.mockReturnValue(savedReview);
      reviewRepository.save!.mockResolvedValue(savedReview);

      const result = await service.createReview(createReviewDto, userId);

      expect(result.message).toBe('Review created successfully');
      expect(result.review.id).toBe('review-id');
      expect(result.review.user).toEqual({
        id: user.id,
        name: user.name,
      });
      expect(result.review.product).toEqual({
        id: product.id,
        name: product.name,
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      productRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.createReview(createReviewDto, userId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      productRepository.findOne!.mockResolvedValue(product);
      orderRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.createReview(createReviewDto, userId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException when order does not belong to user', async () => {
      const otherUserOrder: Order = {
        ...order,
        user: {
          ...user,
          id: 'other-user-id',
        },
      };

      productRepository.findOne!.mockResolvedValue(product);
      orderRepository.findOne!.mockResolvedValue(otherUserOrder);

      await expect(
        service.createReview(createReviewDto, userId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw BadRequestException when order is not delivered', async () => {
      const pendingOrder: Order = {
        ...order,
        status: OrderStatus.PENDING,
      };

      productRepository.findOne!.mockResolvedValue(product);
      orderRepository.findOne!.mockResolvedValue(pendingOrder);

      await expect(
        service.createReview(createReviewDto, userId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException when product is not inside order', async () => {
      productRepository.findOne!.mockResolvedValue(product);
      orderRepository.findOne!.mockResolvedValue(order);
      orderItemRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.createReview(createReviewDto, userId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw ConflictException when review already exists', async () => {
      productRepository.findOne!.mockResolvedValue(product);
      orderRepository.findOne!.mockResolvedValue(order);
      orderItemRepository.findOne!.mockResolvedValue(orderItem);
      reviewRepository.findOne!.mockResolvedValue({
        id: 'existing-review-id',
      });

      await expect(
        service.createReview(createReviewDto, userId),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('updateReview', () => {
    it('should throw BadRequestException when no fields are provided', async () => {
      await expect(
        service.updateReview('review-id', {}, userId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException when review does not exist', async () => {
      reviewRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.updateReview('review-id', { rating: 4 }, userId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException when review belongs to another user', async () => {
      reviewRepository.findOne!.mockResolvedValue({
        id: 'review-id',
        user: {
          id: 'another-user-id',
        },
      });

      await expect(
        service.updateReview('review-id', { rating: 4 }, userId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('hideReview', () => {
    it('should throw NotFoundException when review does not exist', async () => {
      reviewRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.hideReview('review-id', { reason: 'Spam' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ConflictException when review is already hidden', async () => {
      reviewRepository.findOne!.mockResolvedValue({
        id: 'review-id',
        isHidden: true,
      });

      await expect(
        service.hideReview('review-id', { reason: 'Spam' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
