# Tenant Config Schemas

Tenant Configuration File's JSON Schema Definition.

## design-system.json

```json
{
 "colors": {
 "primary": "string (hex color)",
 "secondary": "string (hex color)",
 "accent": "string (hex color, optional)",
 "text": {
 "primary": "string (hex color)",
 "secondary": "string (hex color)",
 "tertiary": "string (hex color)"
 },
 "background": {
 "primary": "string (hex color)",
 "secondary": "string (hex color)",
 "tertiary": "string (hex color)"
 },
 "border": {
 "light": "string (hex color)",
 "dark": "string (hex color)"
 },
 "status": {
 "info": "string (hex color)",
 "success": "string (hex color)",
 "warning": "string (hex color)",
 "error": "string (hex color)"
 }
 },
 "typography": {
 "fontFamily": "string (font name)",
 "fontSize": {
 "xs": "string (px)",
 "sm": "string (px)",
 "base": "string (px)",
 "lg": "string (px)",
 "xl": "string (px)",
 "2xl": "string (px)"
 },
 "fontWeight": {
 "normal": "number",
 "medium": "number",
 "semibold": "number",
 "bold": "number"
 }
 },
 "spacing": {
 "xs": "string (px)",
 "sm": "string (px)",
 "md": "string (px)",
 "lg": "string (px)",
 "xl": "string (px)"
 },
 "borderRadius": {
 "sm": "string (px)",
 "md": "string (px)",
 "lg": "string (px)",
 "full": "string"
 }
}
```

## header.json

```json
{
 "structure": "1row | 2row | 3row",
 "rows": [
 {
 "id": "string",
 "height": "number (px)",
 "background": "string (hex color)",
 "borderBottom": "boolean",
 "items": ["string (item type)"]
 }
 ],
 "logo": {
 "src": "string (filename or URL)",
 "width": "number (px)",
 "height": "number (px)",
 "alt": "string"
 },
 "searchBar": {
 "enabled": "boolean",
 "placeholder": "string",
 "width": "string (px or %)",
 "style": "rounded | pill"
 },
 "promotionBadge": {
 "enabled": "boolean",
 "text": "string",
 "backgroundColor": "string (hex color)",
 "textColor": "string (hex color)"
 },
 "navigation": {
 "position": "center | left | right",
 "items": [
 {
 "label": "string",
 "href": "string",
 "active": "boolean (optional)",
 "badge": "string (optional, e.g., 'NEW', '럭셔리')"
 }
 ]
 },
 "utilityMenu": {
 "items": ["string"],
 "separator": "string"
 },
 "rightMenu": {
 "items": [
 {
 "label": "string",
 "href": "string"
 }
 ]
 }
}
```

## filters.json

```json
{
 "layout": {
 "width": "string (px)",
 "position": "left | right",
 "sticky": "boolean"
 },
 "categories": [
 {
 "id": "string",
 "label": "string",
 "type": "checkbox | radio | range | time-range",
 "expanded": "boolean",
 "options": [
 {
 "value": "string",
 "label": "string",
 "showMinPrice": "boolean (optional)"
 }
 ]
 }
 ]
}
```

**standard Filter Category:**
- `stops`: Stopover (Non-stop, 1 time(s), 2 time(s)+)
- `baggage`: Baggage (Include, unInclude)
- `airlines`: Carrier (Lowest price Display)
- `cabinClass`: Seat Class
- `departureTime`: Departure Time
- `arrivalTime`: Arrival Time

## results.json

```json
{
 "page": "string (page identifier)",
 "layout": {
 "type": "2-column | 3-column",
 "maxWidth": "string (px)",
 "padding": "string (px)",
 "gap": "string (px)"
 },
 "sections": {
 "searchForm": {
 "enabled": "boolean",
 "position": "top | sticky",
 "background": {
 "type": "solid | gradient",
 "colors": ["string"],
 "direction": "string (optional)"
 }
 },
 "leftColumn": {
 "width": "string (px)",
 "content": ["string (component name)"]
 },
 "mainColumn": {
 "width": "string (flex-1 or px)",
 "content": ["string (component name)"]
 }
 },
 "sortOptions": {
 "position": "top | inline",
 "style": "button-group | dropdown",
 "options": [
 {
 "value": "string",
 "label": "string",
 "default": "boolean (optional)"
 }
 ]
 },
 "flightCard": {
 "style": "horizontal | compact",
 "showAirlineLogo": "boolean",
 "showTerminal": "boolean",
 "showBaggage": "boolean",
 "showFareType": "boolean",
 "pricePosition": "right | bottom",
 "expandable": {
 "enabled": "boolean",
 "showFareDetails": "boolean",
 "showSegmentDetails": "boolean"
 }
 },
 "emptyState": {
 "icon": "string",
 "title": "string",
 "description": "string"
 },
 "loading": {
 "type": "skeleton | spinner",
 "count": "number"
 }
}
```
