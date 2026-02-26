import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SearchService } from './search.service';

describe('SearchService', () => {
    let service: SearchService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [SearchService],
        });

        service = TestBed.inject(SearchService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('search', () => {
        it('検索結果を取得しシグナルを更新すること', () => {
            const mockResponse = {
                results: [
                    {
                        id: 'wf-001',
                        type: 'workflow' as const,
                        title: '出張旅費申請',
                        description: '大阪出張の交通費',
                        status: 'submitted',
                        url: '/workflows/wf-001',
                        createdAt: '2026-02-20T09:00:00.000Z',
                    },
                ],
                counts: {
                    workflows: 1,
                    projects: 0,
                    tasks: 0,
                    expenses: 0,
                    total: 1,
                },
                page: 1,
                hasMore: false,
            };

            service.search('出張');

            const req = httpMock.expectOne(
                (r) => r.url === '/api/search' && r.params.get('q') === '出張',
            );
            expect(req.request.method).toBe('GET');
            expect(req.request.params.get('category')).toBe('all');
            req.flush(mockResponse);

            expect(service.results()).toHaveLength(1);
            expect(service.counts().total).toBe(1);
            expect(service.isLoading()).toBe(false);
        });

        it('カテゴリフィルタをクエリパラメータに含めること', () => {
            service.search('プロジェクト', 'projects');

            const req = httpMock.expectOne(
                (r) => r.url === '/api/search' && r.params.get('category') === 'projects',
            );
            req.flush({
                results: [],
                counts: { workflows: 0, projects: 0, tasks: 0, expenses: 0, total: 0 },
                page: 1,
                hasMore: false,
            });
        });

        it('空のクエリでは API を呼び出さないこと', () => {
            service.search('');

            expect(service.results()).toHaveLength(0);
            expect(service.counts().total).toBe(0);
            // No HTTP requests expected
        });

        it('エラー時にエラーシグナルを設定すること', () => {
            service.search('テスト');

            const req = httpMock.expectOne(
                (r) => r.url === '/api/search',
            );
            req.flush({ message: 'サーバーエラー' }, { status: 500, statusText: 'Internal Server Error' });

            expect(service.error()).toBeTruthy();
            expect(service.isLoading()).toBe(false);
        });
    });

    describe('clear', () => {
        it('結果とエラーをクリアすること', () => {
            service.clear();

            expect(service.results()).toHaveLength(0);
            expect(service.counts().total).toBe(0);
            expect(service.error()).toBeNull();
        });
    });
});
