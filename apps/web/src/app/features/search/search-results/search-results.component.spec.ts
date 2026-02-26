import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SearchResultsComponent } from './search-results.component';

describe('SearchResultsComponent', () => {
    let component: SearchResultsComponent;
    let fixture: ComponentFixture<SearchResultsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                SearchResultsComponent,
                HttpClientTestingModule,
                RouterTestingModule,
                NoopAnimationsModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SearchResultsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should highlight text with query', () => {
        const result = component.highlightText('出張旅費申請', '出張');
        expect(result).toContain('<mark>出張</mark>');
    });

    it('should return correct type icons', () => {
        expect(component.getTypeIcon('workflow')).toBe('description');
        expect(component.getTypeIcon('project')).toBe('folder');
        expect(component.getTypeIcon('task')).toBe('check_circle');
        expect(component.getTypeIcon('expense')).toBe('payments');
    });

    it('should return correct type labels', () => {
        expect(component.getTypeLabel('workflow')).toBe('ワークフロー');
        expect(component.getTypeLabel('project')).toBe('プロジェクト');
        expect(component.getTypeLabel('task')).toBe('タスク');
        expect(component.getTypeLabel('expense')).toBe('経費');
    });
});
