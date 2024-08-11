export class Ingredient {
  constructor(
    public id: number, // Added id property
    public name: string,
    public amount: number,
    public price: number
  ) {}
}
