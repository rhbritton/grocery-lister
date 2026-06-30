/** Aisle types used by Add Recipe / grocery lists. */
export const INGREDIENT_TYPE_OPTIONS = [
  { value: '', label: 'Other' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'meat', label: 'Meat' },
  { value: 'produce', label: 'Produce' },
];

export const ALLOWED_INGREDIENT_TYPES = new Set(
  INGREDIENT_TYPE_OPTIONS.map((option) => option.value)
);
