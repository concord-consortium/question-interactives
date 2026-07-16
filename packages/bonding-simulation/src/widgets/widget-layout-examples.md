# Widget Layout Examples

## Widget Size Classes

Each widget type has a predefined size class that determines its layout behavior:
- `"short"` - 40px minimum height (readouts, checkboxes, simple toggles)
- `"tall"` - 80px minimum height (sliders, most controls)
- `"very-tall"` - 120px minimum height (multiple stacked items, complex controls)

**Note:** Widget sizes are determined by the widget type itself, not by simulation authors. For example, all `slider` widgets are `"tall"`, and all `readout` widgets are `"short"`.

## Responsive Behavior

The layout uses CSS Grid with a 2-column layout and fixed 40px rows at all widths:

- **At all widths**: 2-column grid layout with 40px grid rows
  - **Short widgets**: span 1 column × 1 row (40px height)
  - **Tall widgets**: span 1 column × 2 rows (80px height)
  - **Very Tall widgets**: span 2 columns × 3 rows (120px height)
  - Widgets are placed in document order, efficiently using space (e.g., two Short widgets stack next to one Tall widget)

## For Widget Developers

When creating a new widget type, specify its size in the widget registration:

```typescript
registerWidget({
  component: MyWidget,
  size: "tall",  // Choose: "short", "tall", or "very-tall"
  type: "my-widget"
});
```

## Usage in Simulations

Simulation authors do not need to specify widget sizes - they are automatically determined by the widget type:

```javascript
// Slider widget (tall - 80px, determined by widget type)
addWidget({
  data: {
    label: "Temperature",
    min: 0,
    max: 100
  },
  defaultValue: 25,
  globalKey: "temperature",
  type: "slider"
});

// Readout widget (short - 40px, determined by widget type)
addWidget({
  data: {
    label: "Agent Count"
  },
  defaultValue: 0,
  globalKey: "agentCount",
  type: "readout"
});

// Multi-slider widget (very-tall - 120px, determined by widget type)
addWidget({
  data: {
    label: "Nutrients",
    items: ["O₂", "N₂", "CO₂"]
  },
  globalKey: "nutrients",
  type: "multi-slider"
});

```

## Layout Examples

### Example 1: Tall widget with two Short widgets packing beside it
```
Grid rows (40px each):
┌────────────────────────┬────────────────────────┐
│                        │   Readout 1 (short)    │ ← Row 1
│   Slider (tall)        │   spans 1 row          │
│   spans 2 rows         ├────────────────────────┤
│                        │   Readout 2 (short)    │ ← Row 2
│                        │   spans 1 row          │
└────────────────────────┴────────────────────────┘
The tall widget (2 rows = 80px) allows two short widgets (1 row each = 40px) to pack efficiently in the adjacent column.
```

### Example 2: Two Tall widgets
```
┌────────────────────────┬────────────────────────┐
│   Slider 1 (tall)      │   Slider 2 (tall)      │
│   50% width, 80px      │   50% width, 80px      │
└────────────────────────┴────────────────────────┘
```

### Example 3: Very Tall widget
```
┌─────────────────────────────────────────────────┐
│   Multi-Slider (very-tall)                      │
│   100% width, 120px height                      │
└─────────────────────────────────────────────────┘
```

### Example 4: Short widget expands in height when paired with Tall widget
```
┌────────────────────────┬────────────────────────┐
│   Slider (tall)        │   Readout (short)      │
│   spans 2 rows         │   spans 2 rows         │
│   50% width, 80px      │   50% width, 80px      │
└────────────────────────┴────────────────────────┘
When a Short widget is paired with a Tall widget in the same band, the Short widget expands to match the Tall widget's height (80px).
```

### Example 5: Tall widget spans full width when alone
```
┌─────────────────────────────────────────────────┐
│   Slider (tall)                                 │
│   100% width, 80px                              │
└─────────────────────────────────────────────────┘
When a Tall widget is the only widget in a band, it spans the full width of the container.
Note: The same is true for Short widgets—when a Short widget is alone in a band, it also spans the full width (not shown).
```

### Example 6: Mixed sizes
```
┌────────────────────────┬────────────────────────┐
│   Slider 1 (tall)      │   Slider 2 (tall)      │
│   50% width, 80px      │   50% width, 80px      │
├─────────────────────────────────────────────────┤
│   Multi-Slider (very-tall)                      │
│   100% width, 120px (forces new row)            │
├────────────────────────┬────────────────────────┤
│   Checkbox (short)     │   Readout (short)      │
│   50% width, 40px      │   50% width, 40px      │
└────────────────────────┴────────────────────────┘
```

### Example 7: Narrow screens
```
┌──────────────┬──────────────┐
│ Checkbox     │ Slider       │
│ (short)      │ (tall)       │
│ 50%, 40px    │ 50%, 80px    │
├──────────────┴──────────────┤
│ Multi-Slider (very-tall)    │
│ 100% width, 120px           │
├─────────────────────────────┤
│ Readout (short)             │
│ (full width)                │
└─────────────────────────────┘
Two-column layout maintained at all widths; single widgets in a band span the full width and are centered.
```
