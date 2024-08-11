export class Ingredient {
  constructor(
    public id: number, // Added id property
    public name: string,
    public amount: number,
    public price: number
  ) {}
}

export class Recipe {
  public name: string;
  public description: string;
  public imagePath: string; // Updated to imagePath
  public ingredients: Ingredient[];

  constructor(
    name: string,
    desc: string,
    imagePath: string,
    ingredients: Ingredient[]
  ) {
    this.name = name;
    this.description = desc;
    this.imagePath = imagePath;
    this.ingredients = ingredients;
  }
}
