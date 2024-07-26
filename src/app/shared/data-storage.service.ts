import { Injectable } from '@angular/core';
import { SupabaseService } from '../shared/supabase';
import { Recipe } from '../recipes/recipe.model';
import { RecipeService } from '../recipes/recipe.service';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class DataStorageService {
  constructor(
    private supabaseService: SupabaseService,
    private recipeService: RecipeService,
    private authService: AuthService
  ) {}

  async storeRecipes() {
    const recipes = this.recipeService.getRecipes();
    console.log('Storing recipes:', recipes);

    for (const recipe of recipes) {
      console.log('Storing recipe:', recipe);
      const { data: recipeData, error: recipeError } =
        await this.supabaseService.supabase
          .from('recipes')
          .upsert({
            name: recipe.name,
            description: recipe.description,
            image_path: recipe.imagePath,
          })
          .select('id');

      if (recipeError) {
        console.error('Error storing recipe:', recipeError);
        continue;
      }

      const recipeId = recipeData[0].id;
      console.log('Stored recipe with ID:', recipeId);

      for (const ingredient of recipe.ingredients) {
        console.log('Storing ingredient:', ingredient);
        const { data: ingredientData, error: ingredientError } =
          await this.supabaseService.supabase
            .from('ingredients')
            .upsert({
              name: ingredient.name,
              price: ingredient.price,
            })
            .select('id');

        if (ingredientError) {
          console.error('Error storing ingredient:', ingredientError);
          continue;
        }

        const ingredientId = ingredientData[0].id;
        console.log('Stored ingredient with ID:', ingredientId);

        const { error: joinError } = await this.supabaseService.supabase
          .from('recipe_ingredients')
          .upsert({
            recipe_id: recipeId,
            ingredient_id: ingredientId,
            amount: ingredient.amount,
          });

        if (joinError) {
          console.error('Error storing recipe_ingredient relation:', joinError);
        } else {
          console.log(
            `Stored relation: Recipe ID ${recipeId}, Ingredient ID ${ingredientId}, Amount ${ingredient.amount}`
          );
        }
      }
    }
  }

  async fetchRecipes() {
    console.log('Fetching recipes...');
    const { data: recipes, error } = await this.supabaseService.supabase
      .from('recipes')
      .select('*');

    if (error) {
      console.error('Error fetching recipes:', error);
      return;
    }

    console.log('Fetched recipes:', recipes);

    for (const recipe of recipes) {
      console.log('Fetching ingredients for recipe ID:', recipe.id);
      const { data: ingredients, error: ingredientsError } =
        await this.supabaseService.supabase
          .from('recipe_ingredients')
          .select(
            `
          amount,
          ingredients (
            id,
            name,
            price
          )
        `
          )
          .eq('recipe_id', recipe.id);

      if (ingredientsError) {
        console.error('Error fetching ingredients:', ingredientsError);
        continue;
      }

      console.log('Fetched ingredients:', ingredients);

      recipe.ingredients = ingredients.map((i) => ({
        ...i.ingredients,
        amount: i.amount,
      }));
    }

    const loadedRecipes = recipes.map((recipe) => {
      return new Recipe(
        recipe.name,
        recipe.description,
        recipe.image_path,
        recipe.ingredients
      );
    });

    this.recipeService.setRecipes(loadedRecipes);
    console.log('Loaded Recipes:', loadedRecipes);
  }
}
