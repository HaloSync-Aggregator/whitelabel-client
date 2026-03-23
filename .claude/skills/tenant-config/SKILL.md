---
name: tenant-config
description: |
 Whitelabel Tenant Configuration File Generation Skill. Creates design system, component configuration, and page layout JSON files.

 **Trigger Scenario:**
 - "Create DEMO001 Tenant Configuration"
 - "new Tenant Design system Create"
 - "Create Tenant config files"
 - When requesting with Tenant ID, create configuration together
---

# Tenant Config Generator

Create configuration files for per-tenant whitelabel websites.

## Create File Structure

```
tenant/{tenant_id}/
├── design-system.json # Color, typography, spacing
├── components/
│ ├── header.json # Header Structure and menu
│ ├── footer.json # Footer Configuration
│ └── filters.json # Search Filter Category
└── pages/
 └── results.json # Search results Page Layout
```

## Workflow

### 1. Tenant ID Confirm

Tenant ID Format: `[A-Z]{4}[0-9]{3}` (e.g.: DEMO001, HALO002)

### 2. Style Determine

Confirm with user or use default values:

| Style | Description | Template |
|--------|------|--------|
| light-modern | 밝and 련 (DefaultValue) | `assets/templates/light-modern/` |
| google-stitch | AI 심 mobile priority | `assets/templates/google-stitch/` |
| dark-premium | two운 리un엄 | (unImplementation) |
| vibrant | 생동감 exists 컬러풀 | (unImplementation) |

### google-stitch Template feature

- **Primary**: #0066FF (Blue)
- **Accent**: #00C2FF (Cyan)
- **Font**: Plus Jakarta Sans, Space Grotesk
- **Style**: mobile priority, AI 심 UX
- **special 효**: AI gradient border, Shimmer, Backdrop blur
- **Layout**: Single Column, Bottom navigation, FAB Button
- **FlightCard**: 둥근 Card (24px radius), Badge system

### 3. Configuration File Create

Select Template to based `tenant/{tenant_id}/` in directory Configuration File Create.

```bash
# directory Create
mkdir -p tenant/{tenant_id}/components tenant/{tenant_id}/pages
```

### 4. 커스터마이징

User requirementDepending on ConfigurationValue 조specific:
- brand Color Change
- Logo URL Configuration
- menu Item Modify
- Promotion Badge Text

## Template Usage

Template File after Copy `{tenant_id}` Placeholder replacement:

```
assets/templates/{style}/design-system.json → tenant/{tenant_id}/design-system.json
assets/templates/{style}/header.json → tenant/{tenant_id}/components/header.json
assets/templates/{style}/filters.json → tenant/{tenant_id}/components/filters.json
assets/templates/{style}/results.json → tenant/{tenant_id}/pages/results.json
```

## Schema Reference

Detail Schema Definition: `references/schemas.md`
