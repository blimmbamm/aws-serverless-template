import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, catchError, map, of, startWith } from 'rxjs';
import { ApiService, PublicItem } from '../../core/api.service';

type HomeVm = {
  items: PublicItem[] | null;
  error: string | null;
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  private readonly api = inject(ApiService);

  readonly vm$: Observable<HomeVm> = this.api.getPublicItems().pipe(
    map((res) => ({ items: res.items, error: null })),
    startWith({ items: null, error: null }),
    catchError((err: Error) => of({ items: [], error: err.message })),
  );
}
