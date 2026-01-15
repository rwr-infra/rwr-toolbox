import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataLayoutComponent } from './data-layout.component';

describe('DataLayoutComponent', () => {
    let component: DataLayoutComponent;
    let fixture: ComponentFixture<DataLayoutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DataLayoutComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DataLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
