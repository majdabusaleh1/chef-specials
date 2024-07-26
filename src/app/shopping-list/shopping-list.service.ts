import { Ingredient } from '../shared/ingredient.model';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export class ShoppingListService {
  ingredientsChanged = new Subject<Ingredient[]>();
  startedEditing = new Subject<number>();
  private itemAlreadyExisted = new BehaviorSubject<boolean>(false);

  private ingredients: Ingredient[] = [
    // new Ingredient('Apples', 5, 4),
    // new Ingredient('Tomatoes', 10, 2),
  ];

  getIngredients() {
    return this.ingredients.slice();
  }

  getIngredient(index: number) {
    return this.ingredients[index];
  }

  addIngredient(ingredient: Ingredient) {
    if (
      !this.ingredients.some(
        (existingIngredient) => existingIngredient.name === ingredient.name
      )
    ) {
      this.ingredients.push(ingredient);
      this.ingredientsChanged.next(this.ingredients.slice());
    } else {
      this.setItemAlreadyExisted(true);
      console.log('Ingredient already exists in the list');
    }
  }

  addIngredients(ingredients: Ingredient[]) {
    const uniqueIngredients = ingredients.filter(
      (ingredient) =>
        !this.ingredients.some(
          (existingIngredient) => existingIngredient.name === ingredient.name
        )
    );
    // console.log(uniqueIngredients);
    if (uniqueIngredients.length > 0) {
      this.ingredients.push(...uniqueIngredients);
      this.ingredientsChanged.next(this.ingredients.slice());
    } else {
      this.setItemAlreadyExisted(true);
      console.log('All ingredients already exist in the list');
    }
  }

  getItemAlreadyExisted(): Observable<boolean> {
    return this.itemAlreadyExisted.asObservable();
  }

  setItemAlreadyExisted(value: boolean): void {
    this.itemAlreadyExisted.next(value);
  }

  updateIngredient(index: number, newIngredient: Ingredient) {
    this.ingredients[index] = newIngredient;
    this.ingredientsChanged.next(this.ingredients.slice());
  }

  deleteIngredient(index: number) {
    this.ingredients.splice(index, 1);
    this.ingredientsChanged.next(this.ingredients.slice());
  }

  calculateTotal(): number {
    return this.ingredients.reduce((total, ingredient) => {
      return total + ingredient.price * ingredient.amount;
    }, 0);
  }
}
