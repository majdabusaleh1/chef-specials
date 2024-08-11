import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';

import {Recipe} from '../recipe.model';
import {RecipeService} from '../recipe.service';
import {ShoppingListService} from '../../shopping-list/shopping-list.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-recipe-detail',
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.css'],
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe;
  id: number;
  itemAlreadyExisted: boolean;
  private subscription: Subscription;

  constructor(
    private recipeService: RecipeService,
    private route: ActivatedRoute,
    private router: Router,
    private sl: ShoppingListService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.id = +params['id'];
      this.recipe = this.recipeService.getRecipe(this.id);
    });

    this.subscription = this.sl.getItemAlreadyExisted().subscribe((val) => {
      this.itemAlreadyExisted = val;
    });
  }

  onAddToShoppingList() {
    this.recipeService.addIngredientsToShoppingList(this.recipe.ingredients);
  }

  onEditRecipe() {
    this.router.navigate(['edit'], {relativeTo: this.route});
  }

  onDeleteRecipe() {
    const recipeId = this.recipeService.getRecipeIdByName(this.recipe.name);
    if (recipeId !== undefined) {
      this.recipeService.deleteRecipe(this.id, recipeId);
      this.router.navigate(['/recipes']);
    } else {
      console.error('Recipe ID not found for:', this.recipe.name);
    }
  }
}
