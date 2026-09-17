import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { configValidationSchema } from './config/config.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { AvailabilityBlocksModule } from './availability-blocks/availability-blocks.module';
import { BookingsModule } from './bookings/bookings.module';
import { MessagingModule } from './messaging/messaging.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SearchModule } from './search/search.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    // Rate limiting - 10 requests per minute per IP
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time window in milliseconds (1 minute)
      limit: 10, // Max requests per window
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    AvailabilityBlocksModule,
    BookingsModule,
    MessagingModule,
    ReviewsModule,
    SearchModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
