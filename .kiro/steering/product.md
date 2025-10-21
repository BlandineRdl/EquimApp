# Product Overview

EquimApp is a mobile expense-sharing application that revolutionizes how groups manage shared costs through **income-based proportional sharing**. Unlike traditional apps that split expenses equally, EquimApp calculates fair shares based on each member's monthly income, promoting financial equity.

## Core Concept
- **Vision**: Enable fair expense sharing based on income equity
- **Principle**: Those who earn more contribute proportionally more
- **Target Users**: Households, roommates, friends sharing regular expenses

## Key Features
- **Equitable Share Calculation**: Automatic proportional distribution based on income ratios
- **Group Management**: Create and manage multiple expense-sharing groups
- **Invitation System**: Token-based invitations for adding new members
- **Privacy-Conscious**: Users control financial information visibility
- **Mobile-First**: Designed for on-the-go expense management

## User Flow
1. Passwordless authentication via email + 6-digit OTP
2. Onboarding: declare income, create group, add expenses
3. Invite members via shareable links
4. System automatically calculates equitable shares
5. View transparent breakdown of contributions

## Business Logic
- **Formula**: `Your Share = (Your Income / Total Group Income) × Total Expenses`
- **Example**: For 1000€ rent with incomes of 2000€, 3000€, 5000€ → shares are 200€, 300€, 500€
