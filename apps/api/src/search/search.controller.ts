import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { SearchService } from './search.service';
import { SearchListingsDto } from './dto/search-listings.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('listings')
  async searchListings(@Query() searchDto: SearchListingsDto, @Request() req) {
    // Extract user ID if authenticated (optional for search)
    const userId = req.user?.userId;
    return this.searchService.searchListings(searchDto, userId);
  }

  @Get('popular')
  async getPopularSearches(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.searchService.getPopularSearches(parsedLimit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('insights')
  async getDemandInsights() {
    // This endpoint is for admin/analytics - requires auth
    return this.searchService.getDemandInsights();
  }
}
