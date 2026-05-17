import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { HideReviewDto } from './dto/hide-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async createReview(createReviewDto: CreateReviewDto, userId: string) {
    const { productId, orderId, rating, comment } = createReviewDto;

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user.id !== userId) {
      throw new ForbiddenException('This order does not belong to you');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('You can only review delivered orders');
    }

    const orderItem = await this.orderItemRepository.findOne({
      where: {
        order: { id: orderId },
        product: { id: productId },
      },
      relations: ['order', 'product'],
    });

    if (!orderItem) {
      throw new BadRequestException(
        'This product does not exist in this order',
      );
    }

    const existingReview = await this.reviewRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
        order: { id: orderId },
      },
    });

    if (existingReview) {
      throw new ConflictException(
        'You already reviewed this product for this order',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const review = this.reviewRepository.create({
      rating,
      comment,
      user,
      product,
      order,
    });

    const savedReview = await this.reviewRepository.save(review);

    return {
      message: 'Review created successfully',
      review: {
        id: savedReview.id,
        rating: savedReview.rating,
        comment: savedReview.comment,
        user: {
          id: user.id,
          name: user.name,
        },
        product: {
          id: product.id,
          name: product.name,
        },
        order: {
          id: order.id,
          status: order.status,
        },
        createdAt: savedReview.createdAt,
        updatedAt: savedReview.updatedAt,
      },
    };
  }

  async updateReview(
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
  ) {
    const { rating, comment } = updateReviewDto;

    if (rating === undefined && comment === undefined) {
      throw new BadRequestException(
        'At least one field must be provided for update',
      );
    }

    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user', 'product', 'order'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only update your own review');
    }

    if (rating !== undefined) {
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    const updatedReview = await this.reviewRepository.save(review);

    return {
      message: 'Review updated successfully',
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        user: {
          id: review.user.id,
          name: review.user.name,
        },
        product: {
          id: review.product.id,
          name: review.product.name,
        },
        order: {
          id: review.order.id,
          status: review.order.status,
        },
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt,
      },
    };
  }

  async getProductReviews(productId: string, page: number, limit: number) {
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 && limit <= 100 ? limit : 10;

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: {
        product: { id: productId },
        isHidden: false,
      },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      items: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        user: {
          id: review.user.id,
          name: review.user.name,
        },
        createdAt: review.createdAt,
      })),
      page: safePage,
      limit: safeLimit,
      total,
    };
  }

  async getProductRatingSummary(productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const summaryResult = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.productId = :productId', { productId })
      .andWhere('review.isHidden = false')
      .getRawOne<{
        averageRating: string | null;
        totalReviews: string;
      }>();

    const distributionRows = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.productId = :productId', { productId })
      .andWhere('review.isHidden = false')
      .groupBy('review.rating')
      .getRawMany<{
        rating: number;
        count: string;
      }>();

    const distribution: Record<'1' | '2' | '3' | '4' | '5', number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };

    for (const row of distributionRows) {
      const ratingKey = String(row.rating) as '1' | '2' | '3' | '4' | '5';

      if (ratingKey in distribution) {
        distribution[ratingKey] = Number(row.count);
      }
    }

    const averageRating = summaryResult?.averageRating
      ? Number(Number(summaryResult.averageRating).toFixed(1))
      : 0;

    const totalReviews = summaryResult?.totalReviews
      ? Number(summaryResult.totalReviews)
      : 0;

    return {
      productId,
      averageRating,
      totalReviews,
      distribution,
    };
  }
  async hideReview(reviewId: string, hideReviewDto: HideReviewDto) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user', 'product', 'order'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.isHidden) {
      throw new ConflictException('Review is already hidden');
    }

    review.isHidden = true;
    review.hiddenReason = hideReviewDto.reason ?? null;
    review.hiddenAt = new Date();

    const hiddenReview = await this.reviewRepository.save(review);

    return {
      message: 'Review hidden successfully',
      review: {
        id: hiddenReview.id,
        rating: hiddenReview.rating,
        comment: hiddenReview.comment,
        isHidden: hiddenReview.isHidden,
        hiddenReason: hiddenReview.hiddenReason,
        hiddenAt: hiddenReview.hiddenAt,
        user: {
          id: review.user.id,
          name: review.user.name,
        },
        product: {
          id: review.product.id,
          name: review.product.name,
        },
        order: {
          id: review.order.id,
          status: review.order.status,
        },
        createdAt: hiddenReview.createdAt,
        updatedAt: hiddenReview.updatedAt,
      },
    };
  }
}
