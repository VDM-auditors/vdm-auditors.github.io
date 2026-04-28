# VDM Financials Project Context

## Overview
A web-based financial document application for VDM auditors, featuring HTML pages with print-friendly layouts.

## Project Structure
- `index.html` - Main financial document page
- `css/` - Stylesheets for layout and print scaling
- `js/` - JavaScript for interactivity and print control
- `images/` - Company logos and assets
- `.claude/` - Claude Code configuration

## Key Features
- **Print-optimized** layouts (A4 page size locked)
- **Password protection** on select HTML pages
- **Company header** with branded typography
- **Conditional rows** for flexible document generation
- **Print scaling** adjustments for consistent output

## Recent Work
- Improved page layout and print scaling (d8187ab)
- Locked preview to A4 and fixed print output (7416e45)
- Added company header and improved typography (7776ef7)
- Conditional bank rows and audit reordering (751ecff)
- Password lock implementation (e13fa4e)

## Development Notes
- Focus on print compatibility and A4 page constraints
- Test all changes in print preview before committing
- HTML/CSS-first approach (minimal JavaScript)
- Keep file sizes reasonable for web deployment
