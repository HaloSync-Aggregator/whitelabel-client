# Design System

## Overview
The UI design system for Luna B2C.

---

## Button Styles

### Button Types

| Type | Usage | Example |
|------|-------|---------|
| Primary Button | Main action | Pay & Issue, Confirm, Search |
| Secondary Button | Secondary action | Cancel, Close |
| Danger Button | Dangerous/delete action | Cancel PNR, VOID, REFUND |
| Text Button | Link-style action | PNR click, View details, OrderID click |

### Button States

| State | Description |
|-------|-------------|
| Active | Default clickable state |
| Disabled | Not clickable when conditions not met |
| Hover | On mouse over |
| Loading | Processing state |

---

## Color System

### Text Colors

| Usage | Color | Description |
|-------|-------|-------------|
| Default text | Black | Standard text |
| Increased amount | Red | When price increases (+amount) |
| Negative amount | Red | Refund/cancellation amount (-amount) |
| Link text | Blue | Clickable text |

### Status Indicator Colors

| Status | Color | Example |
|--------|-------|---------|
| Success | Green | Booking complete, Ticketing complete |
| Warning | Yellow | Pending, Awaiting confirmation |
| Error | Red | Cancelled, VOIDED |
| Info | Blue | Information message |

---

## Layout Structure

### Page Structure

```
┌─────────────────────────────────────┐
│ GNB (Top Navigation) │
├─────────────────────────────────────┤
│ │
│ Main Content Area │
│ │
├─────────────────────────────────────┤
│ Footer │
└─────────────────────────────────────┘
```

### GNB Menu Structure

| Menu | Sub-pages |
|------|-----------|
| Booking/Ticketing | Flight Search, Search Results |
| DSR List | DSR List |

---

## List/Table Specifications

### Pagination
- Default items per page: **15**

### Table Sort Criteria

| List | Sort Criteria |
|------|--------------|
| DSR List | Ticketing date ascending |

---

## Popup/Modal Types

| Type | Usage | Size |
|------|-------|------|
| Input Popup | Payment info, passenger info input | Large |
| Confirmation Popup | Cancel confirmation, proceed confirmation | Small |
| Information Popup | Policy notice, tax details | Medium |
| Selection Popup | PNR selection, seat selection | Medium |

---

## Icons

| Icon | Usage |
|------|-------|
| Info (i) | Tooltip trigger, detailed info guide |
| Ticket | Policy and included service details |
| Checkbox | Multi-select |
| Radio | Single select |
| Calendar | Date selection |
| Search | Execute search |
| Download | Excel download |

---

## Toast Messages

### Types

| Type | Usage | Example Message |
|------|-------|----------------|
| Success | Task completed | "Booking has been completed." |
| Error | Error occurred | "Please check your input information." |
| Warning | Attention needed | "There are pending ancillary services." |
| Info | Information | "Please confirm the selected flight." |

---

## Input Field States

| State | Description |
|-------|-------------|
| Default | Pre-input state |
| Focus | Active input state |
| Completed | Valid value entered |
| Error | Validation failed |
| Disabled | Input not allowed |

---

## Notes

- Actual design files can be viewed in Moqups
- Version update history managed on Confluence Luna StoryBoard page
- Detailed screenshots per screen available in each Data Element document
