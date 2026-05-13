// tipurile
type Unit = 'g' | 'ml' | 'pcs' | 'to taste';
type PackagingUnit = 'can' | 'tin' | 'pack' | 'packet' | 'package' | 'jar' | 'bottle' | 'box' | 'tub' | 'sachet' | 'container';

// constante
const SPECIAL_FRACTIONS_MAP: Record<string, number> = {
  '1½': 1.5, '1⅓': 1.333, '1⅔': 1.666,
  '1⅛': 1.125, '1⅜': 1.375, '1⅝': 1.625, '1⅞': 1.875,
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 0.125, '⅜': 0.375,
  '⅝': 0.625, '⅞': 0.875,
};

const VAGUE_TERMS = ['to taste', 'optional', 'as needed', 'as required', 'garnish', 'to serve', 'drizzle', 'dash', 'pinch'];

const PACKAGING_UNITS = ['can', 'cans', 'tin', 'tins', 'pack', 'packet', 'package', 'jar', 'jars', 
                        'bottle', 'bottles', 'box', 'boxes', 'tub', 'tubs', 'sachet', 'wrap', 'container'];

const PIECE_WORDS = ['piece', 'clove', 'slice', 'leaf', 'sprig', 'stick', 'egg', 'fillet', 
                     'head', 'pod', 'tail', 'yolk', 'rasher', 'pita'];

const INGREDIENT_CATEGORIES = {
  spices: ['spice', 'powder', 'chilli', 'chili', 'paprika', 'cumin', 'turmeric', 'curry', 
           'pepper', 'nutmeg', 'clove', 'herb', 'oregano', 'basil', 'cinnamon'],
  liquids: ['water', 'oil', 'milk', 'juice', 'vinegar', 'syrup', 'wine', 'broth', 'stock', 
            'sauce', 'extract', 'cream'],
  solids: ['flour', 'sugar', 'salt', 'butter', 'cheese', 'rice', 'beans', 'nuts', 'lentils', 
           'cocoa', 'breadcrumbs'],
  countables: ['egg', 'carrot', 'broccoli', 'apple', 'onion', 'potato', 'tomato', 'pepper', 
               'banana', 'clove', 'mushroom', 'pita']
} as const;

const PACKAGING_WEIGHTS: Record<PackagingUnit, number> = {
  can: 400,
  tin: 400,
  pack: 200,
  packet: 200,
  package: 200,
  jar: 300,
  bottle: 750,
  box: 500,
  tub: 250,
  sachet: 15,
  container: 500
};

// functii utilitare
function parseFractionalQuantity(input: string): number | null {
  const mixed = input.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  const frac = input.match(/^(\d+)\/(\d+)$/);
  
  if (mixed) {
    const [_, whole, numerator, denominator] = mixed;
    return parseInt(whole) + parseInt(numerator) / parseInt(denominator);
  }
  
  if (frac) {
    const [_, numerator, denominator] = frac;
    return parseInt(numerator) / parseInt(denominator);
  }
  
  return null;
}

function defaultWeightForPackaging(unit: string): number | null {
  const normalizedUnit = unit.replace(/s$/, '') as PackagingUnit;
  return PACKAGING_WEIGHTS[normalizedUnit] || null;
}

function handleFallbackByName(name: string): string {
  const lower = name.toLowerCase();
  
  if (INGREDIENT_CATEGORIES.spices.some(w => lower.includes(w))) {
    return 'to taste';
  }
  
  if (INGREDIENT_CATEGORIES.countables.some(c => lower.includes(c))) {
    return '1 pcs';
  }
  
  return 'to taste';
}

/**
 * normalizeaza cantitatile de ingrediente la unitati standard (g, ml, pcs, to taste).
 * @param quantity - string-ul cu cantitatea de normalizat
 * @param name - numele ingredientului  pentru o inferenta mai buna a unitatii
 * @returns string cu cantitatea normalizata
 */
export function normalizeQuantity(quantity: string | undefined | null, name?: string): string {
  if (!quantity) {
    return name ? handleFallbackByName(name) : 'to taste';
  }

  let q = quantity.toLowerCase().trim();

  // inlocuieste simbolurile speciale pentru fractii
  const sortedSymbols = Object.entries(SPECIAL_FRACTIONS_MAP)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [symbol, value] of sortedSymbols) {
    while (q.includes(symbol)) {
      q = q.replace(symbol, value.toString());
    }
  }

  // gestioneaza fractiile mixte
  const mixedMatch = q?.match(/(\d+)\s+(\d+)\/(\d+)/);
  if (mixedMatch) {
    const [_, whole, numerator, denominator] = mixedMatch;
    const total = parseInt(whole) + parseInt(numerator) / parseInt(denominator);
    q = q.replace(mixedMatch[0], total.toString());
  }

  // gestioneaza termenii vagi
  if (VAGUE_TERMS.some(v => q.includes(v))) {
    return q.includes('pinch') ? 'pinch' : 'to taste';
  }

  // unitatile de ambalaj
  const packagingFound = PACKAGING_UNITS.find(p => q.includes(p));
  if (packagingFound) {
    const match = q?.match(/(\d+(\.\d+)?)(\s*)(g|gram|grams|ml|milliliter|milliliters)/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[4];
      return unit.startsWith('g') ? `${value} g` : `${value} ml`;
    }

    const defWeight = defaultWeightForPackaging(packagingFound);
    if (name) {
      const lower = name.toLowerCase();
      if (INGREDIENT_CATEGORIES.spices.some(s => lower.includes(s))) {
        return defWeight ? `${defWeight} g` : 'to taste';
      }
      if (INGREDIENT_CATEGORIES.liquids.some(w => lower.includes(w))) {
        return defWeight ? `${defWeight} ml` : 'to taste';
      }
      return defWeight ? `${defWeight} g` : 'to taste';
    }
    return defWeight ? `${defWeight} g` : '';
  }

  // gestioneaza ingredientele pe bucati
  if (PIECE_WORDS.some(p => q.includes(p)) || 
      (name && PIECE_WORDS.some(p => name.toLowerCase().includes(p)))) {
    const match = q?.match(/(\d+(\.\d+)?)/);
    return match ? `${match[1]} pcs` : '1 pcs';
  }

  // gestioneaza masuratorile cu cup
  if (q.includes('cup')) {
    const match = q?.match(/(\d+(\.\d+)?)/);
    const val = match ? parseFloat(match[1]) : 1;
    
    if (name) {
      const lower = name.toLowerCase();
      if (INGREDIENT_CATEGORIES.solids.some(s => lower.includes(s))) {
        return `${val * 250} g`;
      }
      if (INGREDIENT_CATEGORIES.liquids.some(l => lower.includes(l))) {
        return `${val * 240} ml`;
      }
    }
    return `${val * 240} ml`;
  }

  // masuratorile comune
  if (q?.match(/tablespoon|tbsp|tblsp|tbs/)) {
    const match = q?.match(/(\d+(\.\d+)?)/g);
    const val = match ? match.map(Number).reduce((a, b) => a + b, 0) : 1;
    return `${val * 15} g`;
  }

  if (q?.match(/\btsp\b|\bteaspoon\b/)) {
    let val = 1;
    const mixedFractionMatch = q?.match(/(\d+)\s+(\d+)\/(\d+)/);
    if (mixedFractionMatch) {
      val = parseInt(mixedFractionMatch[1]) + 
            parseInt(mixedFractionMatch[2]) / parseInt(mixedFractionMatch[3]);
    } else {
      const fractionOnlyMatch = q?.match(/(\d+)\/(\d+)/);
      if (fractionOnlyMatch) {
        val = parseInt(fractionOnlyMatch[1]) / parseInt(fractionOnlyMatch[2]);
      } else {
        const normalMatch = q?.match(/(\d+(\.\d+)?)/);
        if (normalMatch) val = parseFloat(normalMatch[1]);
      }
    }
    return `${val * 5} g`;
  }

  // masuratorile de volum
  if (q?.match(/fl\s?oz/)) {
    const match = q?.match(/(\d+(\.\d+)?)/);
    return match ? `${Math.round(parseFloat(match[1]) * 30)} ml` : 'ml';
  }

  if (q?.match(/\d+\s?ml/)) {
    const match = q?.match(/(\d+(\.\d+)?)/);
    return match ? `${match[1]} ml` : 'ml';
  }

  if (q?.match(/\b\d+(\.\d+)?\s?(litre|liter|l)\b/)) {
    const match = q?.match(/(\d+(\.\d+)?)/);
    return match ? `${Math.round(parseFloat(match[1]) * 1000)} ml` : 'ml';
  }

  // masuratorile de greutate
  if (q.includes('kg')) {
    const match = q?.match(/(\d+(\.\d+)?)/);
    return match ? `${Math.round(parseFloat(match[1]) * 1000)} g` : 'g';
  }

  if (q?.match(/\d+\s?g/)) {
    const match = q?.match(/(\d+(\.\d+)?)/);
    return match ? `${match[1]} g` : 'g';
  }

  if (q.includes('lb')) {
    const match = q?.match(/(\d+(\.\d+)?)/);
    return match ? `${Math.round(parseFloat(match[1]) * 454)} g` : 'g';
  }

  if (q?.match(/\b(oz|ounce|ounces)\b/)) {
    const match = q?.match(/(\d+(\.\d+)?)/);
    const val = match ? parseFloat(match[1]) : 1;
    return `${Math.round(val * 28)} g`;
  }

  // gestioneaza valorile numerice cu context de ingredient
  const numMatch = q?.match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);

    if (name) {
      const lower = name.toLowerCase();

      if (INGREDIENT_CATEGORIES.spices.some(w => lower.includes(w))) {
        return 'to taste';
      }

      if (INGREDIENT_CATEGORIES.liquids.some(w => lower.includes(w))) {
        return `${num * 240} ml`;
      }
      
      if (INGREDIENT_CATEGORIES.solids.some(s => lower.includes(s))) {
        return `${num * 100} g`;
      }
      
      if (INGREDIENT_CATEGORIES.countables.some(c => lower.includes(c))) {
        return `${num} pcs`;
      }
    }

    return 'to taste';
  }

  return name ? handleFallbackByName(name) : 'to taste';
} 
