import { Component, OnDestroy, OnInit } from '@angular/core';
import { ShoppingListService } from '../shopping-list.service';
import { Ingredient } from '../../shared/ingredient.model';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  ingredients: Ingredient[];
  private userSub: Subscription;
  userName: string;
  isAuthenticated = false;

  constructor(
    private slService: ShoppingListService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.ingredients = this.slService.getIngredients();
    this.userSub = this.authService.user.subscribe((user) => {
      this.isAuthenticated = !user ? false : true;
      this.userName = user.email.split('@')[0]; // GET THE NAME
    });
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }

  onCalculateTotal(): number {
    return this.slService.calculateTotal();
  }
}
