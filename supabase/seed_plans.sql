-- Seed the 9 nutrition plans
-- Run after 004_nutrition_plans.sql migration

INSERT INTO public.nutrition_plans
  (slug, name, category, tagline, description, inspired_by,
   protein_pct, carbs_pct, fat_pct, meals_per_day,
   meal_timing, key_foods, avoid_foods,
   duration_days, difficulty, strictness,
   primary_organ, secondary_organ, expected_results)
VALUES

-- ═══════════════════════════════════════════
-- PHYSIQUE PLANS
-- ═══════════════════════════════════════════

('bodybuilder-blueprint',
 'The Bodybuilder Blueprint',
 'physique',
 'Build like Arnold',
 'Maximum muscle mass with the nutrition strategy that made champions. Six meals a day, protein every 3 hours, designed for serious hypertrophy.',
 'Arnold Schwarzenegger, Ronnie Coleman',
 40, 35, 25, 6,
 '[{"slot":"breakfast","time":"7:00 AM","label":"Power Breakfast","example":"Eggs, oatmeal, protein shake"},{"slot":"mid-morning","time":"10:00 AM","label":"Mid-Morning Fuel","example":"Greek yogurt, nuts, berries"},{"slot":"lunch","time":"1:00 PM","label":"Mass Builder Lunch","example":"Chicken breast, rice, vegetables"},{"slot":"pre-workout","time":"4:00 PM","label":"Pre-Workout","example":"Banana, protein shake"},{"slot":"dinner","time":"7:00 PM","label":"Recovery Dinner","example":"Lean beef, sweet potato, greens"},{"slot":"evening","time":"9:00 PM","label":"Evening Protein","example":"Cottage cheese, almonds"}]'::jsonb,
 ARRAY['chicken','beef','fish','eggs','oatmeal','rice','sweet potato','broccoli','spinach','greek yogurt','almonds','whey protein','quinoa','cottage cheese'],
 ARRAY['processed foods','sugar','fried foods','alcohol','soda','candy'],
 30, 'intermediate', 4,
 'muscle', 'heart',
 '{"week1":"Increased energy and workout pump","week2":"Visible muscle pump, improved recovery","month1":"Noticeable size gains, strength increase","month3":"Significant muscle mass, defined physique"}'::jsonb),

('athletes-edge',
 'The Athlete''s Edge',
 'physique',
 'Perform like LeBron',
 'Peak performance nutrition for explosive energy. Optimized pre and post workout meals to fuel athletic performance at the highest level.',
 'LeBron James, Cristiano Ronaldo',
 30, 45, 25, 5,
 '[{"slot":"breakfast","time":"7:00 AM","label":"Morning Fuel","example":"Oatmeal, banana, eggs, berries"},{"slot":"pre-workout","time":"11:00 AM","label":"Pre-Workout Meal","example":"Whole grain pasta, chicken, vegetables"},{"slot":"post-workout","time":"2:00 PM","label":"Recovery Window","example":"Protein shake, sweet potato, fruit"},{"slot":"dinner","time":"6:00 PM","label":"Performance Dinner","example":"Salmon, quinoa, mixed greens"},{"slot":"evening","time":"8:30 PM","label":"Slow Release","example":"Casein shake, nuts"}]'::jsonb,
 ARRAY['salmon','chicken','sweet potato','quinoa','oatmeal','banana','berries','eggs','brown rice','avocado','spinach','electrolyte drinks'],
 ARRAY['processed foods','excess sugar','fried foods','alcohol','heavy cream sauces'],
 30, 'intermediate', 3,
 'muscle', 'heart',
 '{"week1":"Better workout energy and endurance","week2":"Faster recovery between sessions","month1":"Measurable performance gains","month3":"Peak athletic conditioning"}'::jsonb),

('lean-aesthetic',
 'The Lean Aesthetic',
 'physique',
 'Cut like Bruce Lee',
 'Low body fat with defined muscle and flexibility. Designed for those who want a lean, functional physique. Intermittent fasting compatible.',
 'Bruce Lee, Zac Efron',
 35, 30, 35, 3,
 '[{"slot":"lunch","time":"12:00 PM","label":"Break Fast","example":"Grilled fish, avocado salad, olive oil dressing"},{"slot":"snack","time":"3:30 PM","label":"Lean Snack","example":"Nuts, dark chocolate, protein shake"},{"slot":"dinner","time":"7:00 PM","label":"Clean Dinner","example":"Turkey breast, roasted vegetables, quinoa"}]'::jsonb,
 ARRAY['fish','turkey','avocado','olive oil','nuts','eggs','leafy greens','berries','dark chocolate','coconut oil','lean beef','sweet potato'],
 ARRAY['sugar','bread','pasta','fried foods','processed snacks','soda','beer'],
 30, 'advanced', 4,
 'muscle', 'gut',
 '{"week1":"Reduced bloating, mental clarity","week2":"Visible definition improvement","month1":"Noticeable body composition change","month3":"Lean, defined physique achieved"}'::jsonb),

-- ═══════════════════════════════════════════
-- LONGEVITY PLANS
-- ═══════════════════════════════════════════

('centenarian-protocol',
 'The Centenarian Protocol',
 'longevity',
 'Live to 100+',
 'Inspired by Blue Zone populations who routinely live past 100. Plant-based whole foods with early dinners and natural fasting windows.',
 'Blue Zone populations (Okinawa, Sardinia, Ikaria)',
 15, 55, 30, 3,
 '[{"slot":"breakfast","time":"7:30 AM","label":"Morning Ritual","example":"Miso soup, fermented vegetables, whole grain toast"},{"slot":"lunch","time":"12:00 PM","label":"Main Meal","example":"Lentil stew, leafy greens, olive oil, whole grain bread"},{"slot":"dinner","time":"5:30 PM","label":"Early Light Dinner","example":"Vegetable soup, beans, small fish"}]'::jsonb,
 ARRAY['lentils','beans','leafy greens','olive oil','whole grains','sweet potato','tofu','miso','fermented vegetables','nuts','berries','turmeric','green tea'],
 ARRAY['processed meat','refined sugar','white flour','excess dairy','fried foods','soda','alcohol (excess)'],
 30, 'beginner', 2,
 'immune', 'heart',
 '{"week1":"Improved digestion and energy","week2":"Better sleep patterns","month1":"Reduced inflammation markers","month3":"Measurable bio age improvement"}'::jsonb),

('biohacker-stack',
 'The Biohacker''s Stack',
 'longevity',
 'Optimize every biomarker',
 'Precision nutrition tracked down to micronutrients. Time-restricted eating with specific vitamin and compound ratios for anti-aging.',
 'Bryan Johnson, Peter Attia',
 25, 40, 35, 3,
 '[{"slot":"breakfast","time":"8:00 AM","label":"Longevity Shake","example":"Blueberry, cocoa, flax, collagen, NAD+ precursors in almond milk"},{"slot":"lunch","time":"12:30 PM","label":"Precision Plate","example":"Salmon, cruciferous vegetables, extra virgin olive oil, sweet potato"},{"slot":"dinner","time":"5:00 PM","label":"Final Meal","example":"Lentils, dark leafy greens, fermented foods, turmeric"}]'::jsonb,
 ARRAY['salmon','blueberries','broccoli','extra virgin olive oil','dark chocolate','green tea','turmeric','nuts','flaxseed','lentils','spinach','collagen','fermented foods'],
 ARRAY['processed foods','refined sugar','seed oils','alcohol','fried foods','excess caffeine','artificial sweeteners'],
 30, 'advanced', 5,
 'brain', 'immune',
 '{"week1":"Sharper mental focus, stable energy","week2":"Improved sleep quality","month1":"Visible skin and energy improvements","month3":"Bio age reversal trajectory established"}'::jsonb),

-- ═══════════════════════════════════════════
-- COGNITIVE PLANS
-- ═══════════════════════════════════════════

('mental-clarity',
 'The Mental Clarity Protocol',
 'cognitive',
 'Think sharper, focus longer',
 'Ketogenic-leaning nutrition designed for sustained cognitive performance. Skip or lighten breakfast, fuel the brain with healthy fats.',
 'Silicon Valley executives, Tim Ferriss',
 25, 20, 55, 3,
 '[{"slot":"breakfast","time":"10:00 AM","label":"Brain Fuel (Optional)","example":"Bulletproof coffee or skip — light fast until lunch"},{"slot":"lunch","time":"1:00 PM","label":"Focus Lunch","example":"Salmon, avocado, leafy greens, olive oil, walnuts"},{"slot":"dinner","time":"6:30 PM","label":"Cognitive Dinner","example":"Grass-fed beef, roasted vegetables, dark chocolate"}]'::jsonb,
 ARRAY['salmon','walnuts','avocado','eggs','olive oil','dark chocolate','blueberries','spinach','MCT oil','sardines','coconut oil','turmeric','green tea'],
 ARRAY['sugar','bread','pasta','cereal','juice','soda','fried foods','processed snacks'],
 30, 'intermediate', 4,
 'brain', 'gut',
 '{"week1":"Noticeable mental clarity and focus","week2":"Sustained energy without crashes","month1":"Improved memory and cognitive performance","month3":"Sharp, consistent mental performance daily"}'::jsonb),

('creative-genius',
 'The Creative Genius Diet',
 'cognitive',
 'Feed your muse',
 'Mediterranean-style eating for creativity, mood stability, and mental endurance. Diverse whole foods with social eating encouraged.',
 'Mediterranean tradition, artists and writers',
 20, 45, 35, 3,
 '[{"slot":"breakfast","time":"8:00 AM","label":"Inspired Morning","example":"Whole grain toast, olive oil, tomato, feta, fruit"},{"slot":"lunch","time":"12:30 PM","label":"Creative Fuel","example":"Mediterranean salad with grilled fish, hummus, whole grain pita"},{"slot":"dinner","time":"7:00 PM","label":"Social Dinner","example":"Pasta with vegetables, olive oil, seafood, glass of red wine"}]'::jsonb,
 ARRAY['olive oil','fish','tomatoes','nuts','whole grains','legumes','berries','leafy greens','feta','hummus','avocado','herbs','red wine (moderate)'],
 ARRAY['processed foods','excess sugar','fried foods','fast food','artificial ingredients'],
 30, 'beginner', 2,
 'brain', 'gut',
 '{"week1":"Better mood and creative flow","week2":"Stable energy throughout the day","month1":"Noticeably improved mood and focus","month3":"Sustained creative output and mental clarity"}'::jsonb),

-- ═══════════════════════════════════════════
-- RECOVERY PLANS
-- ═══════════════════════════════════════════

('inflammation-fighter',
 'The Inflammation Fighter',
 'recovery',
 'Calm the fire within',
 'Whole food protocol designed to reduce chronic inflammation and pain. Anti-inflammatory foods at every meal, regular eating schedule.',
 'Anti-inflammatory research protocol',
 20, 45, 35, 3,
 '[{"slot":"breakfast","time":"7:30 AM","label":"Anti-Inflam Breakfast","example":"Turmeric oatmeal with berries, walnuts, and ginger tea"},{"slot":"lunch","time":"12:00 PM","label":"Healing Lunch","example":"Salmon, quinoa, leafy greens with olive oil and lemon"},{"slot":"dinner","time":"6:30 PM","label":"Recovery Dinner","example":"Chicken bone broth soup, steamed vegetables, sweet potato"}]'::jsonb,
 ARRAY['salmon','turmeric','ginger','berries','leafy greens','olive oil','walnuts','bone broth','sweet potato','garlic','green tea','cherries','pineapple'],
 ARRAY['sugar','fried foods','processed meat','refined carbs','alcohol','seed oils','artificial additives','excess dairy'],
 30, 'beginner', 3,
 'immune', 'gut',
 '{"week1":"Reduced bloating and joint stiffness","week2":"Noticeable pain reduction","month1":"Significant inflammation decrease","month3":"Chronic inflammation well managed"}'::jsonb),

('gut-reset',
 'The Gut Reset',
 'recovery',
 'Rebuild your microbiome',
 'Restore microbiome diversity and digestive health with high-fiber, fermented foods and prebiotics. Regular meals, no late eating.',
 'Functional medicine approach',
 20, 50, 30, 3,
 '[{"slot":"breakfast","time":"7:30 AM","label":"Gut Starter","example":"Kefir smoothie with banana, flax, and prebiotic fiber"},{"slot":"lunch","time":"12:00 PM","label":"Diversity Lunch","example":"Lentil soup with sauerkraut, mixed vegetables, whole grain bread"},{"slot":"dinner","time":"6:00 PM","label":"Microbiome Dinner","example":"Grilled chicken, kimchi, roasted root vegetables, miso"}]'::jsonb,
 ARRAY['kefir','yogurt','kimchi','sauerkraut','miso','lentils','beans','banana','garlic','onion','asparagus','oats','flaxseed','whole grains','diverse vegetables'],
 ARRAY['artificial sweeteners','excess sugar','processed foods','fried foods','alcohol','excess antibiotics use foods'],
 30, 'beginner', 2,
 'gut', 'immune',
 '{"week1":"Reduced bloating, more regular digestion","week2":"Improved energy and mood","month1":"Significant digestive improvement","month3":"Robust gut health and diverse microbiome"}'::jsonb)

ON CONFLICT (slug) DO NOTHING;
