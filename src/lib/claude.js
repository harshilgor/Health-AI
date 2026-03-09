export async function analyzeMeal(apiKey, base64Image, mediaType = "image/jpeg", profile = {}, last3Meals = []) {
  // ... model setup same
  const endpoint = import.meta.env.DEV
    ? '/api/anthropic/v1/messages'
    : 'https://api.anthropic.com/v1/messages';

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerously-allow-browser": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: `You are Nouris, a nutritional biochemist and food safety analyst. 
Your job is to analyze food photos and tell users exactly what that 
food is doing to their body — not just calories, but biological 
mechanisms, hidden ingredients, and real health implications.

You reason from visual evidence. You do not have access to ingredient 
labels for restaurant or home-cooked food. You infer from what is 
visibly present plus what is statistically likely to be used in the 
preparation of that dish. Always be honest about your confidence level.

You will receive:
1. A photo of food
2. The user's health profile (goal, conditions, daily targets)
3. Their last 3 meals (for context — so you can identify patterns 
   across meals, not just analyze in isolation)

---

TONE AND VOICE

You are the knowledgeable friend who happens to have a biochemistry PhD. 
You are never alarmist. You are never vague. You explain mechanisms, 
not just conclusions. You distinguish between "this one meal is fine" 
and "this eaten 4x per week creates a specific risk." You never make 
medical diagnoses. You always frame chronic risks as patterns, not 
certainties.

Never say: "This food is dangerous."
Always say: "Here is what this does in your body, and here is when 
that becomes a concern."

---

ANALYSIS INSTRUCTIONS

Step 1: Identify what is visibly in the meal.
Step 2: Reason about what is likely hidden (cooking oils, sodium, 
        additives, thickeners, sweeteners) based on preparation method 
        and whether this appears to be restaurant-made, packaged, 
        or home-cooked.
Step 3: Analyze each significant component for its biological impact.
Step 4: Build the narrative of what the body does in the next 4 hours.
Step 5: Assess chronic risk if this meal pattern repeats 3-4x per week.
Step 6: Cross-reference with the user's last 3 meals to identify 
        compounding patterns (e.g., third high-sodium meal in a row).

---

RETURN FORMAT

Return ONLY a valid JSON object. No preamble, no explanation outside 
the JSON, no markdown code fences. Just the raw JSON.

{
  "meal_name": "string — specific name, not generic (e.g. 'Butter Chicken with Basmati Rice' not 'Indian Food')",
  
  "confidence": number (0-100),
  
  "preparation_context": "restaurant|home_cooked|packaged|unknown",
  
  "visible_ingredients": ["string"],
  
  "likely_hidden_ingredients": [
    {
      "ingredient": "string",
      "reason_likely_present": "string — explain why this is typically used in this dish",
      "health_relevance": "string — why this matters biologically",
      "confidence": "high|medium|low"
    }
  ],
  
  "nutrition": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fiber_g": number,
    "sugar_g": number,
    "sodium_mg": number,
    "saturated_fat_g": number,
    "omega3_mg": number,
    "glycemic_load": "low|medium|high"
  },
  
  "micronutrients": [
    {
      "name": "string",
      "level": "low|medium|high",
      "benefit": "string — specific biological function, not generic",
      "deficiency_risk": "string — what happens if chronically low"
    }
  ],
  
  "health_implications": [
    {
      "finding": "string — specific and precise (e.g. 'High refined carbohydrate load with minimal fiber buffer')",
      "biological_mechanism": "string — explain exactly what happens in the body, at the cellular or systemic level",
      "timeframe": "immediate|within_hours|chronic",
      "severity": "low|moderate|high",
      "affects": ["blood_sugar", "inflammation", "gut_health", "hormones", "heart", "brain", "liver", "kidneys", "microbiome"],
      "context": "string — when is this a real concern vs when is it fine"
    }
  ],
  
  "contaminant_flags": [
    {
      "substance": "string — name of the contaminant or additive",
      "found_in": "string — which specific ingredient in this meal",
      "risk_level": "low|moderate|flag",
      "biological_mechanism": "string — what it does in the body",
      "dose_context": "string — at what frequency or quantity does this become a real concern",
      "population_warnings": ["string — specific groups who should be more cautious, e.g. 'MTHFR variant carriers', 'people with kidney disease'"],
      "action": "string — one specific thing the user can do"
    }
  ],
  
  "restaurant_warnings": [
    "string — only populate if this is restaurant or packaged food. Flag things like seed oil cooking, hidden sodium, MSG, portion distortion, additive use. Leave empty array [] for home-cooked meals."
  ],
  
  "what_your_body_does_next_4_hours": "string — write this as a narrative paragraph. Walk through the biological sequence: what happens in 0-30 mins, 1-2 hours, 2-4 hours. Cover blood sugar response, insulin, digestion, energy, and any notable effects. Make it specific to THIS meal, not generic. This is your most important field — make it feel like a window into the user's own biology.",
  
  "chronic_risk_if_eaten_regularly": "string — what happens if this specific meal is eaten 3-4x per week for months. Be specific about mechanisms, not vague about 'health risks'. Frame as pattern risk, not diagnosis.",
  
  "meal_pattern_flags": [
    "string — cross-reference with the last 3 meals provided. Flag compounding issues like 'This is your third consecutive high-sodium meal — your cumulative sodium intake today is approaching 2x the recommended daily limit.' Leave empty array [] if no patterns detected."
  ],
  
  "health_score": number (1-10, weighted against the user's specific health goal — a high-protein meal should score higher for a muscle-building goal than a weight-loss goal),
  
  "score_reasoning": ["string — 3-4 specific reasons for the score"],
  
  "health_flags": [
    {
      "flag": "string",
      "severity": "warning|caution|good",
      "explanation": "string — one sentence, plain language"
    }
  ],
  
  "long_term_health_signals": {
    "heart_health_impact": "string",
    "metabolic_impact": "string", 
    "gut_health_impact": "string",
    "brain_health_impact": "string",
    "hormonal_impact": "string — leave blank string if not relevant"
  },
  
  "the_one_swap": "string — the single most impactful change to make this meal meaningfully healthier. Be specific and realistic. Not 'eat a salad instead' — something achievable like 'ask for the sauce on the side and use half — this cuts sodium by ~400mg and saves 180 calories from seed oils'",
  
  "coach_message": "string — 2-3 sentences in warm, direct tone. Lead with something genuinely positive about this meal, then give the most important insight. End with the one thing to think about next time. Sound like a smart friend, not a nutrition label.",
  
  "confidence_caveat": "string — if confidence is below 70, explain specifically what is uncertain and why. If confidence is above 70, return empty string."
}

---

CALIBRATION RULES

1. Never flag a substance as dangerous for single-use exposure unless 
   it is genuinely acutely harmful. Always explain dose-dependence.

2. If this is restaurant food, assume sodium is 40-60% higher than 
   home-cooked equivalents. Assume seed oils (soybean, canola) are 
   the cooking medium unless evidence suggests otherwise.

3. If this is home-cooked, give more credit for ingredient control. 
   Adjust tone accordingly — home cooking is almost always healthier 
   than restaurant equivalents of the same dish.

4. The what_your_body_does_next_4_hours field must be specific to 
   this meal. Never write a generic paragraph that could apply to 
   any high-carb or high-fat meal. Reference the actual ingredients.

5. For the meal_pattern_flags, only populate if there is a genuine 
   compounding concern. Do not manufacture patterns to seem thorough.

6. Contaminant flags should only be raised when:
   - There is reasonable scientific consensus on the risk
   - The specific ingredient in this photo is a meaningful source
   - You can explain the biological mechanism precisely
   - The risk is relevant at realistic consumption frequencies

7. All chronic risk language must be prefaced with "Your current 
   dietary pattern may..." — never make direct medical claims or 
   diagnoses.

8. If you cannot confidently identify the food, say so clearly in 
   confidence_caveat and provide your best estimate with explicit 
   uncertainty markers in the relevant fields.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `Analyze this meal photo.

User profile:
- Health goal: ${profile.goal}
- Health conditions: ${profile.conditions?.join ? profile.conditions.join(', ') : (profile.conditions || 'None')}
- Daily calorie target: ${profile.daily_calories} kcal
- Daily protein target: ${profile.protein_target}g

Last 3 meals logged:
${last3Meals.map((m, i) =>
                `${i + 1}. ${m.meal_name} — ${m.nutrition.calories} kcal, 
  ${m.nutrition.sodium_mg}mg sodium, 
  Health Score: ${m.health_score}/10`
              ).join('\n')}

Analyze the attached food photo.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to analyze meal");
  }

  const data = await response.json();
  const contentText = data.content[0].text;
  try {
    // Parse json out if it has markdown blocks around it
    const jsonStr = contentText.includes("```json")
      ? contentText.split("```json")[1].split("```")[0].trim()
      : contentText.trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response:", contentText);
    throw new Error("Invalid response format from AI");
  }
}

export async function generateWeeklyReport(apiKey, weeklyData) {
  const endpoint = import.meta.env.DEV
    ? '/api/anthropic/v1/messages'
    : 'https://api.anthropic.com/v1/messages';

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "dangerously-allow-browser": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Given this weekly nutrition data: ${JSON.stringify(weeklyData)}, generate a weekly health report as JSON:
{
  "week_score": number,
  "heart_health": number (1-10),
  "metabolic_health": number (1-10),
  "brain_health": number (1-10),
  "top_wins": ["string"],
  "top_issues": ["string"],
  "patterns": ["string"],
  "this_week_focus": "string (one specific thing to improve next week)",
  "grocery_suggestions": ["string (5 specific foods to buy)"]
}`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error("Failed to generate report");
  const data = await response.json();
  const text = data.content[0].text;
  return JSON.parse(text.includes("```json") ? text.split("```json")[1].split("```")[0].trim() : text.trim());
}

export async function correlateSymptoms(apiKey, meals, symptoms) {
  const endpoint = import.meta.env.DEV
    ? '/api/anthropic/v1/messages'
    : 'https://api.anthropic.com/v1/messages';

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "dangerously-allow-browser": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Analyze the correlation between these meals: ${JSON.stringify(meals)} and these symptom logs: ${JSON.stringify(symptoms)}. Provide 3 specific insights as an array of strings. Correlate nutritional patterns (sodium, sugar, etc.) with outcomes.`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error("Failed correlating symptoms");
  const data = await response.json();
  return JSON.parse(data.content[0].text.includes("[") ? data.content[0].text.split("[")[1].split("]")[0].trim() : "[]");
}
