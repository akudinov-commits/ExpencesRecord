# Expense date control — Architecture

## 1. Pipeline / Integration
Replace the entry screen's separate date badge, Change date button and conditional editor with one always-available Date field. Its visible value is the existing selectedDateLabel; the native date input owns selection and accessibility. This follows the user's explicit consolidation request and retains the accepted date/weekday/Today/Past behavior.

## 2. Component Diagram
Existing ExpenseScreen -> existing Field/TextInput and semantic date tokens -> browser-native date picker. Existing draft state -> existing context client -> protected backend. No new service, boundary or dependency.

## 3. Data Flow
Native input change supplies the same ISO calendar date to draft.edit. Existing state invalidation/month routing remains authoritative. Pointer or Enter/Space opens the native picker where supported; unavailable/refused showPicker falls back to native input focus. Today/Past text and weekday remain visible inside the one field, with a focus ring and accessible Date label/description.

## 4. Data Stores Summary
No new stores or persisted date. Existing in-memory draft is reused. The private Preview mapping continues to select only the isolated January 2020 test fixture; no configuration or spreadsheet change.

## 5. Extension Points
Compose existing Field/TextInput and tokens; retain generic UI/application/API separation. Review's informational date remains unchanged.

## 6. Security & Isolation
Date is still disabled during saving; existing owner/Origin/CSRF and final-read protections remain. No financial write tests, private-setting uploads, real-workbook access, main merge or Production release. Deliver the requested review adjustment on the existing checked UI Preview branch.
