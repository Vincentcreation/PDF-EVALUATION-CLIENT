/**
 * Targeted tests covering the bugs identified in the user's review:
 * 1. Unified calculation source (PORTION_AVERAGES)
 * 2. Carb cycling wired to day type
 * 3. Validation tolerances (50 kcal, 5 g)
 * 4. Auto-calculate bank
 * 5. Hydration from bank kcal
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBMR, calculateTDEE, calculateTargets, calculateTargetsForDay,
  applyRestDayMacros, calculateBaseHydration, calculateHydration,
  validatePlan, autoCalculateBank, macrosToKcal,
} from '../calculations';
import {
  PORTION_AVERAGES, computeBankTotals, computeMealTotals, distributeClassique,
  portionMapToMeals, isBankEmpty, areMealsEmpty, defaultFoodBank, defaultMeals,
  FOOD_CATEGORIES,
} from '../foodBank';
import type { Profile, DayFoodBank, MealSlotPortion, FoodCategory } from '../../types';

// ─── Test profile ─────────────────────────────────────────────────────────────
const homme30: Profile = {
  id: 'test', nom: 'Test', sexe: 'homme', age: 30,
  poids: 80, unitePoids: 'kg',
  taille: 180, uniteHauteur: 'cm', taillepieds: 0, taillePouces: 0,
  niveauActivite: 'modere',
  createdAt: '', updatedAt: '',
};

const femme25: Profile = {
  id: 'test2', nom: 'Test2', sexe: 'femme', age: 25,
  poids: 60, unitePoids: 'kg',
  taille: 165, uniteHauteur: 'cm', taillepieds: 0, taillePouces: 0,
  niveauActivite: 'leger',
  createdAt: '', updatedAt: '',
};

// ─── 1. IOM/EER formula ───────────────────────────────────────────────────────
describe('IOM/EER BMR formula', () => {
  it('homme 30 ans 80 kg 180 cm → expected ≈ 1872 kcal', () => {
    // 662 − 9.53×30 + 1×(15.91×80 + 539.6×1.80)
    const expected = 662 - 9.53 * 30 + 1.0 * (15.91 * 80 + 539.6 * 1.80);
    expect(calculateBMR(homme30)).toBeCloseTo(expected, 0);
  });

  it('femme 25 ans 60 kg 165 cm → expected ≈ 1413 kcal', () => {
    const expected = 354 - 6.91 * 25 + 1.0 * (9.36 * 60 + 726 * 1.65);
    expect(calculateBMR(femme25)).toBeCloseTo(expected, 0);
  });

  it('TDEE modere homme uses PA=1.25', () => {
    const bmr  = calculateBMR(homme30);
    const tdee = calculateTDEE(homme30);
    // PA_HOMME modere = 1.25; TDEE = 662 − 9.53×30 + 1.25×(15.91×80 + 539.6×1.80)
    const expected = 662 - 9.53 * 30 + 1.25 * (15.91 * 80 + 539.6 * 1.80);
    expect(tdee).toBeCloseTo(expected, 0);
    expect(tdee).toBeGreaterThan(bmr); // TDEE > BMR
  });
});

// ─── 2. Carb cycling ──────────────────────────────────────────────────────────
describe('Carb cycling (rest day)', () => {
  const training = { proteines: 25, glucides: 45, lipides: 30 };

  it('rest day reduces glucides by 25% and raises lipides by 15%', () => {
    const rest = applyRestDayMacros(training);
    const rawG = 45 * 0.75;
    const rawL = 30 * 1.15;
    const nonP = 100 - 25;
    const expectedG = Math.round((rawG / (rawG + rawL)) * nonP);
    const expectedL = nonP - expectedG;
    expect(rest.glucides).toBe(expectedG);
    expect(rest.lipides).toBe(expectedL);
    expect(rest.proteines).toBe(25);
  });

  it('rest+training G+L should both sum to 100-P', () => {
    const rest = applyRestDayMacros(training);
    expect(rest.proteines + rest.glucides + rest.lipides).toBe(100);
  });

  it('calculateTargetsForDay returns different targets for training vs rest', () => {
    const macros = { proteines: 25, glucides: 45, lipides: 30 };
    const tTargets = calculateTargetsForDay(homme30, macros, 'maintien', 'entrainement', 'gkg', 2.0);
    const rTargets = calculateTargetsForDay(homme30, macros, 'maintien', 'repos',        'gkg', 2.0);
    // Rest day has fewer glucides
    expect(rTargets.glucidesG).toBeLessThan(tTargets.glucidesG);
    // Rest day has more lipides
    expect(rTargets.lipidesG).toBeGreaterThan(tTargets.lipidesG);
    // Protein is unchanged (computed from g/kg)
    expect(rTargets.proteinesG).toBe(tTargets.proteinesG);
  });
});

// ─── 3. Unified calculation (PORTION_AVERAGES) ───────────────────────────────
describe('PORTION_AVERAGES as single source of truth', () => {
  it('computeBankTotals uses PORTION_AVERAGES not food item values', () => {
    const bank: DayFoodBank = {
      proteines: 1, feculent: 0, legumes: 0, fruits: 0, laitiers: 0, graisses: 0, whey: 0,
      selectedProteines: 'volaille', selectedFeculent: 'riz', selectedLegumes: 'legumes_verts',
      selectedFruits: 'pomme', selectedLaitiers: 'fromage_blanc', selectedGraisses: 'huile_olive', selectedWhey: 'whey_std',
    };
    const totals = computeBankTotals(bank);
    expect(totals.proteines).toBe(PORTION_AVERAGES.proteines.p);  // 9, not 25 (volaille)
    expect(totals.kcal).toBe(PORTION_AVERAGES.proteines.kcal);    // 54, not 127 (volaille)
  });

  it('computeMealTotals uses PORTION_AVERAGES', () => {
    const portions: MealSlotPortion[] = [
      { category: 'proteines', portions: 1 },
      { category: 'feculent',  portions: 2 },
    ];
    const t = computeMealTotals(portions);
    expect(t.proteines).toBe(PORTION_AVERAGES.proteines.p + PORTION_AVERAGES.feculent.p * 2);
    expect(t.kcal).toBe(PORTION_AVERAGES.proteines.kcal + PORTION_AVERAGES.feculent.kcal * 2);
  });

  it('bank totals and sum of meal totals are consistent', () => {
    const bank = defaultFoodBank();
    const portionMap = distributeClassique(bank);
    const meals = portionMapToMeals(portionMap);
    const bankTotals = computeBankTotals(bank);

    // Sum meal totals
    let sumP = 0, sumG = 0, sumL = 0, sumK = 0;
    for (const slot of Object.values(meals)) {
      const t = computeMealTotals(slot.portions);
      sumP += t.proteines; sumG += t.glucides; sumL += t.lipides; sumK += t.kcal;
    }

    // Bank totals and sum of meal totals should match (within rounding)
    expect(Math.abs(sumP - bankTotals.proteines)).toBeLessThanOrEqual(2);
    expect(Math.abs(sumG - bankTotals.glucides)).toBeLessThanOrEqual(2);
    expect(Math.abs(sumL - bankTotals.lipides)).toBeLessThanOrEqual(2);
    expect(Math.abs(sumK - bankTotals.kcal)).toBeLessThanOrEqual(10);
  });
});

// ─── 4. Portion distribution ─────────────────────────────────────────────────
describe('Portion distribution', () => {
  it('distributeClassique total equals bank total for each category', () => {
    const bank = defaultFoodBank();
    const portionMap = distributeClassique(bank);
    const meals = portionMapToMeals(portionMap);

    for (const cat of FOOD_CATEGORIES) {
      const bankQty = bank[cat as keyof DayFoodBank] as number;
      let mealTotal = 0;
      for (const slot of Object.values(meals)) {
        const pt = slot.portions.find(p => p.category === cat as FoodCategory);
        mealTotal += pt?.portions ?? 0;
      }
      expect(mealTotal).toBeCloseTo(bankQty, 1); // within 0.5 portion
    }
  });

  it('single portion distributed across meals stays exactly 1 portion total', () => {
    const bank: DayFoodBank = {
      proteines: 1, feculent: 0, legumes: 0, fruits: 0, laitiers: 0, graisses: 0, whey: 0,
      selectedProteines: 'volaille', selectedFeculent: 'riz', selectedLegumes: 'legumes_verts',
      selectedFruits: 'pomme', selectedLaitiers: 'fromage_blanc', selectedGraisses: 'huile_olive', selectedWhey: 'whey_std',
    };
    const portionMap = distributeClassique(bank);
    const meals = portionMapToMeals(portionMap);
    let total = 0;
    for (const slot of Object.values(meals)) {
      const pt = slot.portions.find(p => p.category === 'proteines');
      total += pt?.portions ?? 0;
    }
    expect(total).toBe(1);
  });
});

// ─── 5. Validation tolerances ────────────────────────────────────────────────
describe('Validation tolerances (50 kcal, 5 g)', () => {
  it('exact match returns ok', () => {
    const r = validatePlan(2000, 2000, 150, 150, 220, 220, 65, 65);
    expect(r.status).toBe('ok');
    expect(r.messages).toHaveLength(0);
  });

  it('45 kcal difference returns ok', () => {
    const r = validatePlan(2045, 2000, 150, 150, 220, 220, 65, 65);
    expect(r.status).toBe('ok');
  });

  it('55 kcal difference returns warn', () => {
    const r = validatePlan(2055, 2000, 150, 150, 220, 220, 65, 65);
    expect(r.status).toBe('warn');
  });

  it('105 kcal difference returns error', () => {
    const r = validatePlan(2105, 2000, 150, 150, 220, 220, 65, 65);
    expect(r.status).toBe('error');
  });

  it('4 g protein difference returns ok', () => {
    const r = validatePlan(2000, 2000, 154, 150, 220, 220, 65, 65);
    expect(r.status).toBe('ok');
  });

  it('6 g protein difference returns warn', () => {
    const r = validatePlan(2000, 2000, 156, 150, 220, 220, 65, 65);
    expect(r.status).toBe('warn');
  });

  it('empty bank returns error with message', () => {
    const r = validatePlan(0, 2000, 0, 150, 0, 220, 0, 65, true);
    expect(r.status).toBe('error');
    expect(r.bankEmpty).toBe(true);
  });
});

// ─── 6. Hydration ────────────────────────────────────────────────────────────
describe('Hydration calculation', () => {
  it('1 L per 1000 kcal, rounded to 1 decimal', () => {
    expect(calculateBaseHydration(2000)).toBe(2000); // 2.0 L = 2000 ml
    expect(calculateBaseHydration(2500)).toBe(2500); // 2.5 L = 2500 ml
    expect(calculateBaseHydration(1800)).toBe(1800); // 1.8 L = 1800 ml
    // round(2250/1000*10)/10 = round(22.5)/10 = 23/10 = 2.3 → 2300 ml
    expect(calculateBaseHydration(2250)).toBe(2300);
  });

  it('uses bank kcal when bank is non-empty', () => {
    const r = calculateHydration(2000, 1500, 0); // bank=2000, target=1500
    expect(r.base).toBe(2000); // uses bank kcal
  });

  it('uses target kcal when bank is empty', () => {
    const r = calculateHydration(0, 2000, 0); // bank=0 (empty)
    expect(r.base).toBe(2000);
  });

  it('adds manual ml to base', () => {
    const r = calculateHydration(0, 2000, 500);
    expect(r.total).toBe(2500);
  });
});

// ─── 7. Auto-calculate bank ───────────────────────────────────────────────────
describe('Auto-calculate bank', () => {
  it('produces positive portion counts', () => {
    const targets = calculateTargets(homme30, { proteines: 25, glucides: 45, lipides: 30 }, 'maintien', 'gkg', 2.0);
    const bank = autoCalculateBank(targets);
    expect(bank.proteines).toBeGreaterThan(0);
    expect(bank.legumes).toBeGreaterThanOrEqual(2);
    expect(bank.fruits).toBeGreaterThanOrEqual(2);
  });

  it('resulting bank kcal is in a reasonable range (±30%) of target', () => {
    const targets = calculateTargets(homme30, { proteines: 25, glucides: 45, lipides: 30 }, 'maintien', 'gkg', 2.0);
    const bank = autoCalculateBank(targets);
    // Build a DayFoodBank from the result
    const fullBank: DayFoodBank = {
      proteines: bank.proteines, feculent: bank.feculent, legumes: bank.legumes,
      fruits: bank.fruits, laitiers: bank.laitiers, graisses: bank.graisses, whey: bank.whey,
      selectedProteines: 'volaille', selectedFeculent: 'riz', selectedLegumes: 'legumes_verts',
      selectedFruits: 'pomme', selectedLaitiers: 'fromage_blanc', selectedGraisses: 'huile_olive', selectedWhey: 'whey_std',
    };
    const totals = computeBankTotals(fullBank);
    expect(totals.kcal).toBeGreaterThan(targets.targetKcal * 0.70);
    expect(totals.kcal).toBeLessThan(targets.targetKcal * 1.30);
  });
});

// ─── 8. isBankEmpty / areMealsEmpty ──────────────────────────────────────────
describe('Bank and meal empty checks', () => {
  it('isBankEmpty detects all-zero bank', () => {
    const bank = defaultFoodBank();
    expect(isBankEmpty(bank)).toBe(false);
    const emptyBank: DayFoodBank = { ...bank, proteines: 0, feculent: 0, legumes: 0, fruits: 0, laitiers: 0, graisses: 0, whey: 0 };
    expect(isBankEmpty(emptyBank)).toBe(true);
  });

  it('areMealsEmpty detects no portions', () => {
    const meals = defaultMeals();
    expect(areMealsEmpty(meals)).toBe(true);
    meals.petitDejeuner.portions = [{ category: 'proteines', portions: 1 }];
    expect(areMealsEmpty(meals)).toBe(false);
  });
});

// ─── 9. Protein-first macro calculation ──────────────────────────────────────
describe('Protein-first calculateTargets', () => {
  it('gkg mode: protein grams = g/kg × bodyweight', () => {
    const t = calculateTargets(homme30, { proteines: 25, glucides: 45, lipides: 30 }, 'maintien', 'gkg', 2.0);
    expect(t.proteinesG).toBe(2.0 * 80); // 160 g
  });

  it('pct mode: protein grams = pct% of target kcal / 4', () => {
    const t = calculateTargets(homme30, { proteines: 25, glucides: 45, lipides: 30 }, 'maintien', 'pct', 2.0);
    const expectedP = Math.round((t.targetKcal * 0.25) / 4);
    expect(t.proteinesG).toBe(expectedP);
  });

  it('total kcal from macros is close to targetKcal', () => {
    const t = calculateTargets(homme30, { proteines: 25, glucides: 45, lipides: 30 }, 'maintien', 'gkg', 2.0);
    const sumKcal = macrosToKcal(t.proteinesG, t.glucidesG, t.lipidesG);
    // Within 50 kcal of target (rounding from integer gram values)
    expect(Math.abs(sumKcal - t.targetKcal)).toBeLessThan(50);
  });
});
