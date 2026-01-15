import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModsLayoutComponent } from './mods-layout.component';

describe('ModsLayoutComponent', () => {
    let component: ModsLayoutComponent;
    let fixture: ComponentFixture<ModsLayoutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ModsLayoutComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ModsLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
