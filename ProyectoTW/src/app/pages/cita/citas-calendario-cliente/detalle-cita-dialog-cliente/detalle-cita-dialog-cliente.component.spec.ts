import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleCitaDialogClienteComponent } from './detalle-cita-dialog-cliente.component';

describe('DetalleCitaDialogClienteComponent', () => {
  let component: DetalleCitaDialogClienteComponent;
  let fixture: ComponentFixture<DetalleCitaDialogClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetalleCitaDialogClienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleCitaDialogClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
