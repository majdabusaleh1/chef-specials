import {Injectable} from '@angular/core';
import {SupabaseService} from '../shared/supabase';
import {Recipe} from '../recipes/recipe.model';
import {RecipeService} from '../recipes/recipe.service';

@Injectable({providedIn: 'root'})
export class DataStorageService {
  constructor(
    private supabaseService: SupabaseService,
    private recipeService: RecipeService
  ) {}

  async storeRecipes() {
    const recipes = this.recipeService.getRecipes();
    console.log('Storing recipes:', recipes);

    for (const recipe of recipes) {
      console.log('Storing recipe:', recipe.name);

      // Check if the recipe already exists
      const {data: existingRecipe, error: fetchRecipeError} =
        await this.supabaseService.supabase
          .from('recipes')
          .select('id')
          .eq('name', recipe.name)
          .single();

      if (fetchRecipeError && fetchRecipeError.code !== 'PGRST116') {
        console.error('Error checking recipe existence:', fetchRecipeError);
        continue;
      }

      let recipeId;

      if (existingRecipe) {
        // Update the existing recipe
        const {data: recipeData, error: updateRecipeError} =
          await this.supabaseService.supabase
            .from('recipes')
            .update({
              description: recipe.description,
              image_path: recipe.imagePath,
            })
            .eq('id', existingRecipe.id)
            .select('id');

        if (updateRecipeError) {
          console.error('Error updating recipe:', updateRecipeError);
          continue;
        }

        recipeId = recipeData[0].id;
      } else {
        // Insert new recipe
        const {data: recipeData, error: insertRecipeError} =
          await this.supabaseService.supabase
            .from('recipes')
            .insert({
              name: recipe.name,
              description: recipe.description,
              image_path: recipe.imagePath,
            })
            .select('id');

        if (insertRecipeError) {
          console.error('Error inserting recipe:', insertRecipeError);
          continue;
        }

        recipeId = recipeData[0].id;
      }

      console.log('Stored recipe with ID:', recipeId);

      for (const ingredient of recipe.ingredients) {
        console.log(
          'Storing ingredient:',
          ingredient.name,
          ', Recipe ID:',
          recipeId
        );

        // Check if the ingredient already exists
        const {data: existingIngredient, error: fetchIngredientError} =
          await this.supabaseService.supabase
            .from('ingredients')
            .select('id')
            .eq('name', ingredient.name)
            .single();

        if (fetchIngredientError && fetchIngredientError.code !== 'PGRST116') {
          console.error(
            'Error checking ingredient existence:',
            fetchIngredientError
          );
          continue;
        }

        let ingredientId;

        if (existingIngredient) {
          // Update the existing ingredient only if necessary
          const {data: ingredientData, error: updateIngredientError} =
            await this.supabaseService.supabase
              .from('ingredients')
              .update({
                price: ingredient.price,
              })
              .eq('id', existingIngredient.id)
              .select('id');

          if (updateIngredientError) {
            console.error('Error updating ingredient:', updateIngredientError);
            continue;
          }

          ingredientId = ingredientData[0].id;
        } else {
          // Insert new ingredient
          const {data: ingredientData, error: insertIngredientError} =
            await this.supabaseService.supabase
              .from('ingredients')
              .insert({
                name: ingredient.name,
                price: ingredient.price,
              })
              .select('id');

          if (insertIngredientError) {
            console.error('Error inserting ingredient:', insertIngredientError);
            continue;
          }

          ingredientId = ingredientData[0].id;
        }

        console.log('Stored ingredient with ID:', ingredientId);

        // Upsert the relationship in the recipe_ingredients table
        const {error: joinError} = await this.supabaseService.supabase
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
    const {data: recipes, error} = await this.supabaseService.supabase
      .from('recipes')
      .select('*');

    if (error) {
      console.error('Error fetching recipes:', error);
      return;
    }

    console.log('Fetched recipes:', recipes);

    const recipesMap = new Map<string, number>();

    for (const recipe of recipes) {
      console.log(`Fetched recipe: ${recipe.name}, ID: ${recipe.id}`);
      recipesMap.set(recipe.name, recipe.id);

      console.log(`Fetching ingredients for recipe ID: ${recipe.id}`);
      const {data: ingredients, error: ingredientsError} =
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
      return {
        name: recipe.name,
        description: recipe.description,
        imagePath: recipe.image_path,
        ingredients: recipe.ingredients,
      };
    });

    this.recipeService.setRecipes(loadedRecipes, recipesMap);
    console.log('Loaded Recipes:', loadedRecipes);
  }
}
