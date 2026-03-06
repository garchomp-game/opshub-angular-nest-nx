import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CacheTTL } from '@nestjs/cache-manager';
import { TenantCacheInterceptor } from '../../common/interceptors/tenant-cache.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    @UseInterceptors(TenantCacheInterceptor)
    @CacheTTL(15_000)
    search(@CurrentUser() user: any, @Query() query: SearchQueryDto) {
        const roles = (user.roles ?? []).map((r: any) =>
            typeof r === 'string' ? r : r.role,
        );
        return this.searchService.searchAll(
            user.tenantId,
            user.id,
            roles,
            query,
        );
    }
}
