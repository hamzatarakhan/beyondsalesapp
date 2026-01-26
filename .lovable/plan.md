
# Active Filters Display

## Overview
Add a visual section to display currently applied filters as dismissible chips/badges, showing users exactly what filters are affecting the displayed data (e.g., "Showing results for: Sara, Ahmed").

## What Will Change

### New Active Filters Section
A new section will appear between the **Wallet Selection** and **Transaction History** sections when any filters are active. This section will display:

1. **Selected Members** (Parent view only) - Individual chips for each selected child member
2. **Date Range** - Shows the selected date range if not default (Last 7 Days)
3. **Transaction Type** - Shows Credit or Debit if filtered
4. **Activity Type** - Shows the specific activity type if filtered

### Chip Design
Each filter chip will include:
- Filter label with value (e.g., "Member: Sara")
- X button to quickly remove that specific filter
- Styled with muted background and rounded-full corners

### Clear All Option
A "Clear All" button will appear when multiple filters are active, allowing users to reset all filters at once.

---

## Technical Details

### Location in Code
The new section will be added in `src/pages/EWalletReports.tsx` between lines 386-389 (after Wallet Selection, before Transaction History).

### New UI Elements
```text
+------------------------------------------+
| Active Filters                 Clear All |
+------------------------------------------+
| [Member: Sara ×] [Member: Ahmed ×]       |
| [Date: Today ×] [Type: Credit ×]         |
+------------------------------------------+
```

### Implementation Steps

1. **Add Badge Import** - Import the Badge component from `@/components/ui/badge`

2. **Add X Icon Import** - Import the X icon from lucide-react for dismiss functionality

3. **Create Helper Functions**:
   - `getDateRangeLabel()` - Returns human-readable date range text
   - `removeMember(name)` - Removes a specific member from selection
   - Individual filter removal handlers

4. **Add Conditional Active Filters Section**:
   - Only renders when `activeFiltersCount > 0`
   - Displays header with "Active Filters" label and "Clear All" button
   - Renders filter chips in a flex-wrap container
   - Each chip shows filter type and value with dismiss button

### Files to Modify
- `src/pages/EWalletReports.tsx` - Add the active filters display section

### No New Dependencies Required
Uses existing Badge component and lucide-react icons already in the project.
