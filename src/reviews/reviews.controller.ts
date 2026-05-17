import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { HideReviewDto } from './dto/hide-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a review for a purchased product',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired JWT token',
  })
  @ApiNotFoundResponse({
    description: 'Product or order was not found',
  })
  @ApiForbiddenResponse({
    description: 'The order does not belong to the authenticated customer',
  })
  @ApiBadRequestResponse({
    description:
      'The order is not delivered, the product is not inside the order, or validation failed',
  })
  @ApiConflictResponse({
    description: 'The customer already reviewed this product for this order',
  })
  @UseGuards(JwtAuthGuard)
  @Post('reviews')
  createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviewsService.createReview(createReviewDto, request.user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update an existing review',
  })
  @ApiParam({
    name: 'reviewId',
    description: 'Review UUID',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired JWT token',
  })
  @ApiNotFoundResponse({
    description: 'Review was not found',
  })
  @ApiForbiddenResponse({
    description: 'The review does not belong to the authenticated customer',
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload or no fields provided for update',
  })
  @UseGuards(JwtAuthGuard)
  @Patch('reviews/:reviewId')
  updateReview(
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviewsService.updateReview(
      reviewId,
      updateReviewDto,
      request.user.id,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Hide a review as an admin',
    description:
      'Allows an admin user to hide inappropriate or spam reviews. Hidden reviews are excluded from public review lists and rating summaries.',
  })
  @ApiParam({
    name: 'reviewId',
    description: 'Review UUID',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Admin access is required',
  })
  @ApiNotFoundResponse({
    description: 'Review was not found',
  })
  @ApiConflictResponse({
    description: 'Review is already hidden',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/reviews/:reviewId/hide')
  hideReview(
    @Param('reviewId') reviewId: string,
    @Body() hideReviewDto: HideReviewDto,
  ) {
    return this.reviewsService.hideReview(reviewId, hideReviewDto);
  }

  @ApiOperation({
    summary: 'Get product reviews with pagination',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
  })
  @ApiNotFoundResponse({
    description: 'Product was not found',
  })
  @Get('products/:productId/reviews')
  getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.reviewsService.getProductReviews(
      productId,
      Number(page),
      Number(limit),
    );
  }

  @ApiOperation({
    summary: 'Get product rating summary',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
  })
  @ApiNotFoundResponse({
    description: 'Product was not found',
  })
  @Get('products/:productId/rating-summary')
  getProductRatingSummary(@Param('productId') productId: string) {
    return this.reviewsService.getProductRatingSummary(productId);
  }
}
