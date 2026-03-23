# Modification Workflow

Existing 사이트 Modify/보완 Detail Guide.

## Modify per Type Access Method

| Modify Type | Key/Main Change Target | Example |
|----------|--------------|------|
| Style Change | design-system.json, CSS | Color Change, font Change |
| Component Add | components/*.json, TSX | new Badge Add, Button Add |
| Feature Add | TSX, hooks, API | Filter Add, Sort Option Add |
| Layout Change | pages/*.json, TSX | Column Change, area Add |
| bug Modify | TSX, hooks, utils | Data Mapping Error, Style Error |

---

## Style Change

### process

```
1. Change Request Analysis
 ↓
2. design-system.json Modify
 ↓
3. in Component reflect
```

### Example: 라이머리 Color Change

1. **design-system.json Modify**
```json
{
 "colors": {
 "primary": "#newColorCode"
 }
}
```

2. **CSS variable Update**
```css
:root {
 --color-primary: #newColorCode;
}
```

3. **Verify**
- Button Color Confirm
- activationproperty menu Color Confirm
- link Color Confirm

---

## Component Add

### process

```
1. Add Request Analysis
 ↓
2. Component JSON Spec Write (Required)
 ↓
3. TSX Component Implementation
 ↓
4. Parent in Component Integration
```

### Example: in Header Promotion Badge Add

1. **header.json Modify**
```json
{
 "promotionBadge": {
 "enabled": true,
 "text": "New Promotion",
 "backgroundColor": "#FF5722",
 "textColor": "#ffffff"
 }
}
```

2. **Header.tsx Modify**
```tsx
// promotionBadge Rendering Add
{header.promotionBadge?.enabled && (
 <span
 className="px-2 py-1 text-xs rounded"
 style={{
 backgroundColor: header.promotionBadge.backgroundColor,
 color: header.promotionBadge.textColor,
 }}
 >
 {header.promotionBadge.text}
 </span>
)}
```

---

## Feature Add

### process

```
1. Feature requirementnotes Analysis
 ↓
2. API Mapping Confirm (Required)
 ↓
3. Status/Logic Implementation (hooks, utils)
 ↓
4. UI Component Implementation/Modify
```

### Example: in Filter 'PaymentCondition' Category Add

1. **filters.json Modify**
```json
{
 "categories": [
 // ... Existing Category
 {
 "id": "paymentCondition",
 "label": "PaymentCondition",
 "type": "checkbox",
 "options": [
 { "value": "immediate", "label": "ImmediatelyPayment" },
 { "value": "deferred", "label": "afterPayment" }
 ]
 }
 ]
}
```

2. **FilterPanel.tsx Modify**
```tsx
// PaymentCondition Filter Rendering Add
<FilterCategory
 category={paymentConditionCategory}
 selected={filters.paymentCondition}
 onChange={handleFilterChange}
/>
```

3. **useFlightSearch.ts Modify**
```tsx
// Filter Logic Add
const filteredFlights = flights.filter(flight => {
 if (filters.paymentCondition.length > 0) {
 return filters.paymentCondition.includes(flight.paymentType);
 }
 return true;
});
```

---

## Layout Change

### process

```
1. Layout Change Request Analysis
 ↓
2. pages/*.json Modify
 ↓
3. Page TSX Modify
```

### Example: Search results 2Column → 3Column

1. **results.json Modify**
```json
{
 "layout": {
 "columns": 3,
 "leftColumn": { "width": "240px", "content": "filters" },
 "centerColumn": { "width": "flex-1", "content": "results" },
 "rightColumn": { "width": "200px", "content": "banners" }
 }
}
```

2. **ResultsPage.tsx Modify**
```tsx
<div className="flex gap-6">
 <aside className="w-[240px] flex-shrink-0">
 <FilterPanel />
 </aside>
 <main className="flex-1">
 <FlightList />
 </main>
 {/* Newly Add Right side Column */}
 <aside className="w-[200px] flex-shrink-0">
 <PromoBanners />
 </aside>
</div>
```

---

## bug Modify

### General-like bug Type

| Type | Symptom | Resolution method |
|------|------|----------|
| Data Mapping Error | Wrong Value Display | API Response Path Confirm |
| Style Error | design mismatch | CSS/Tailwind class Modify |
| Status Management Error | Value un갱신 | useState/useEffect Confirm |
| Conditionsection Rendering Error | Element unDisplay/Duplicate | Condition문 Logic Confirm |

### Debug Order

```
1. console to Log Data Confirm
 ↓
2. API Response Structure Confirm
 ↓
3. Mapping Logic Confirm
 ↓
4. Rendering Condition Confirm
 ↓
5. Style Applied Confirm
```

---

## Verify Checklist

Modify after Complete Confirm:

```
□ Modify notes 올Bar르게 reflect되었?
□ Existing in Feature 향 absent?
□ Different Page/in Component 향 absent?
□ Responsive-type Layout maintain? (exists Case)
□ in console Error absent?
```

---

## 롤백 strategy

after Modify issue Occurs time:

1. **Git Use **: `git checkout -- {FilePath}`
2. **manual 백업 **: 백업 to File 복KRW
3. **Re-Implementation**: frontend-whitelabel to agent KRW래 Spec based Re-Implementation
