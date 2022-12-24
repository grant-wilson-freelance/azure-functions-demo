import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  BehaviorSubject,
  combineLatest,
  finalize,
  ReplaySubject,
  Subject,
  switchMap,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { EditProductDialogComponent } from './edit-product-dialog/edit-product-dialog.component';
import { Product } from './model/product';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private _refreshProductsSubject = new ReplaySubject<void>(1);
  _products$ = combineLatest([this._refreshProductsSubject]).pipe(
    switchMap((_) =>
      this._http.get<Product[]>(`${environment.apiUrl}/products`)
    )
  );

  private _loadingSubject = new BehaviorSubject(false);
  _loading$ = this._loadingSubject.asObservable();

  _displayedColumns = ['id', 'name', 'description', 'quantity', 'action'];

  constructor(private _http: HttpClient, private _dialog: MatDialog) {}

  ngOnInit(): void {
    this._refreshProductsSubject.next();
  }

  _add() {
    const product: Partial<Product> = {};
    this._dialog
      .open<EditProductDialogComponent, Partial<Product>, Partial<Product>>(
        EditProductDialogComponent,
        {
          data: product,
        }
      )
      .afterClosed()
      .subscribe((p) => this._saveProduct(p));
  }

  _edit(product: Product) {
    this._dialog
      .open<EditProductDialogComponent, Product, Product>(
        EditProductDialogComponent,
        {
          data: product,
        }
      )
      .afterClosed()
      .subscribe((p) => this._saveProduct(p));
  }

  _delete(product: Product) {
    this._beginLoad();
    this._http
      .delete<Product>(`${environment.apiUrl}/products/${product.id}`)
      .pipe(finalize(() => this._loadComplete()))
      .subscribe();
  }

  private _saveProduct(p?: Partial<Product>) {
    if (p == null) {
      return;
    }
    if (p.id) {
      this._http
        .put<Product>(`${environment.apiUrl}/products/${p.id}`, p)
        .pipe(finalize(() => this._loadComplete()))
        .subscribe();
    } else {
      this._http
        .post<Product>(`${environment.apiUrl}/products`, {
          id: Math.floor(Math.random() * 1000 + 10),
          ...p,
        })
        .pipe(finalize(() => this._loadComplete()))
        .subscribe();
    }
  }

  private _beginLoad() {
    this._loadingSubject.next(true);
  }

  private _loadComplete() {
    this._loadingSubject.next(false);
    this._refreshProductsSubject.next();
  }
}
