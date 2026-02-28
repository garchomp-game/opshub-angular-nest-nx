import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ExpenseService } from './expense.service';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExpenseService],
    });

    service = TestBed.inject(ExpenseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('loadAll', () => {
    it('経費一覧を取得しシグナルを更新すること', () => {
      const mockResponse = {
        data: [
          {
            id: 'exp-001',
            category: '交通費',
            amount: 15000,
            expenseDate: '2026-02-20',
            createdBy: { id: 'user-001', displayName: '田中太郎' },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      };

      service.loadAll();

      const req = httpMock.expectOne('/api/expenses');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(service.expenses()).toHaveLength(1);
      expect(service.total()).toBe(1);
      expect(service.isLoading()).toBe(false);
    });

    it('カテゴリフィルタをクエリパラメータに含めること', () => {
      service.loadAll({ category: '交通費' });

      const req = httpMock.expectOne((r) =>
        r.url === '/api/expenses' && r.params.get('category') === '交通費',
      );
      req.flush({ data: [], total: 0, page: 1, limit: 20 });
    });

    it('エラー時にエラーシグナルを設定すること', () => {
      service.loadAll();

      const req = httpMock.expectOne('/api/expenses');
      req.flush({ message: 'エラー' }, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBeTruthy();
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('create', () => {
    it('経費を作成してPOSTリクエストを送信すること', () => {
      const dto = {
        category: '交通費',
        amount: 15000,
        expenseDate: '2026-02-20',
        projectId: 'proj-001',
        approverId: 'approver-001',
      };

      service.create(dto).subscribe();

      // Create request
      const createReq = httpMock.expectOne('/api/expenses');
      expect(createReq.request.method).toBe('POST');
      expect(createReq.request.body).toEqual(dto);
      createReq.flush({ id: 'exp-new', ...dto });

      // loadAll called after create
      const listReq = httpMock.expectOne('/api/expenses');
      listReq.flush({ data: [], total: 0, page: 1, limit: 20 });
    });
  });

  describe('getSummaryByCategory', () => {
    it('カテゴリ別集計を取得すること', () => {
      const query = { dateFrom: '2026-02-01', dateTo: '2026-02-28' };

      service.getSummaryByCategory(query).subscribe((result) => {
        expect(result).toHaveLength(1);
        expect(result[0].category).toBe('交通費');
      });

      const req = httpMock.expectOne(
        (r) => r.url === '/api/expenses/summary/by-category',
      );
      expect(req.request.params.get('dateFrom')).toBe('2026-02-01');
      req.flush([{ category: '交通費', count: 25, totalAmount: 375000, percentage: 100 }]);
    });
  });
});
