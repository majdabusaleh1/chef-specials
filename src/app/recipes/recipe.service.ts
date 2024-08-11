import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {Recipe} from './recipe.model';
import {Ingredient} from '../shared/ingredient.model';
import {ShoppingListService} from '../shopping-list/shopping-list.service';
import {SupabaseService} from '../shared/supabase';

@Injectable({providedIn: 'root'})
export class RecipeService {
  recipesChanged = new Subject<Recipe[]>();

  private recipes: Recipe[] = [];
  private recipeMap: Map<string, number> = new Map(); // Map to store recipe names and their IDs

  constructor(
    private slService: ShoppingListService,
    private supabaseService: SupabaseService
  ) {}

  setRecipes(recipes: Recipe[], recipesMap: Map<string, number>) {
    this.recipes = recipes.slice();
    this.recipeMap = recipesMap;
    this.recipesChanged.next(this.recipes.slice());
  }

  getRecipes() {
    console.log('Returning a copy of the current recipes:', this.recipes);
    return this.recipes.slice();
  }

  getRecipe(index: number) {
    return this.recipes[index];
  }

  getRecipeIdByName(name: string): number | undefined {
    return this.recipeMap.get(name);
  }

  addIngredientsToShoppingList(ingredients: Ingredient[]) {
    this.slService.addIngredients(ingredients);
  }

  addRecipe(recipe: Recipe) {
    this.recipes.push(recipe);
    this.recipesChanged.next(this.recipes.slice());
  }

  updateRecipe(index: number, newRecipe: Recipe) {
    this.recipes[index] = newRecipe;
    this.recipesChanged.next(this.recipes.slice());
  }

  async deleteRecipe(index: number, recipeId: number): Promise<void> {
    const recipe = this.recipes[index];

    // Start a transaction
    const supabase = this.supabaseService.supabase;

    try {
      // First, delete associations from recipe_ingredients
      await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId);

      console.log(`Deleted associations for recipe ID: ${recipeId}`);

      // Then, delete ingredients if they are not associated with any other recipes
      for (const ingredient of recipe.ingredients) {
        const {count} = await supabase
          .from('recipe_ingredients')
          .select('*', {count: 'exact'})
          .eq('ingredient_id', ingredient.id);

        if (count === 0) {
          await supabase.from('ingredients').delete().eq('id', ingredient.id);

          console.log(`Deleted ingredient ID: ${ingredient.id}`);
        } else {
          console.log(
            `Ingredient ID: ${ingredient.id} is used by another recipe and was not deleted.`
          );
        }
      }

      // Finally, delete the recipe itself
      await supabase.from('recipes').delete().eq('id', recipeId);

      console.log(`Deleted recipe with ID: ${recipeId} from the database.`);

      // Remove the recipe from the local array and notify subscribers
      this.recipes.splice(index, 1);
      this.recipesChanged.next(this.recipes.slice());
    } catch (error) {
      console.error(
        'Error deleting recipe or its ingredients from the database:',
        error
      );
    }
  }
}
