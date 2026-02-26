import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
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
