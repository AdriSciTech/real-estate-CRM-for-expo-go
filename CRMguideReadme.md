# CRM Relationship Implementation Guide

## What I've Implemented

### 1. **AddPropertyScreen** - Property to Collaborator Relationship
- Added `source_type` dropdown (landlord/developer/partner)
- Added conditional `source_collaborator_id` dropdown that filters collaborators based on source type:
  - If "landlord" → shows only collaborators with type='landlord'
  - If "developer" → shows only collaborators with type='developer'
  - If "partner" → shows collaborators with type='agency' or 'other'
- Integrated with existing form validation using yup schema
- Maintains the route parameter functionality for pre-selecting collaborator

### 2. **AddClientScreen** - Client to Collaborator Relationship
- Added `source_type` dropdown (direct/partner/referral/website)
- Added conditional `source_collaborator_id` dropdown that appears only when:
  - "partner" is selected → shows only agencies (type='agency')
  - "referral" is selected → shows all collaborators
- No collaborator dropdown shown for "direct" or "website" sources
- Integrated with existing form validation

## Required Dependencies

You'll need to install the React Native Picker:
```bash
npm install @react-native-picker/picker
# or
yarn add @react-native-picker/picker

# For iOS, also run:
cd ios && pod install
```

## Additional Areas Needing Similar Implementation

### 1. **Edit Screens**
You'll need to update the EditPropertyScreen and EditClientScreen with the same dropdown logic:
- Copy the source selection logic from the Add screens
- Ensure the dropdowns properly load the existing values when editing

### 2. **Developer Projects**
Create screens for managing developer projects that:
- Only show developers in the collaborator dropdown
- Link properties to specific projects when source_type='developer'

### 3. **Deals Module**
The deals module needs to:
- Automatically populate `source_property_collaborator_id` from the selected property
- Automatically populate `source_client_collaborator_id` from the selected client
- Display these as read-only fields in the deal form

### 4. **Contact History & Tasks**
Implement the `related_to_type` and `related_to_id` dropdowns:
- First dropdown selects entity type (client/collaborator for contacts, client/property/deal/other for tasks)
- Second dropdown shows filtered list based on selected type

### 5. **List Views & Filters**
Update list screens to:
- Display collaborator names alongside properties/clients
- Add filters for source_type and specific collaborators
- Show relationship information in list items

### 6. **Services Layer Updates**
You may need to update your services to:
- Include collaborator data when fetching properties/clients
- Add filtering capabilities by source_type and collaborator

### 7. **Store Updates**
Consider adding to your stores:
```typescript
// In propertiesStore.ts
fetchPropertiesByCollaborator: (collaboratorId: string) => Promise<void>;
fetchPropertiesBySourceType: (sourceType: string) => Promise<void>;

// In clientsStore.ts
fetchClientsByCollaborator: (collaboratorId: string) => Promise<void>;
fetchClientsBySourceType: (sourceType: string) => Promise<void>;
```

## Database Considerations

### 1. **Add Database Triggers/Functions**
Consider adding validation at the database level:
- Ensure source_collaborator_id matches the expected collaborator type based on source_type
- Prevent deletion of collaborators that have associated properties/clients

### 2. **Add Indexes**
For better performance:
```sql
CREATE INDEX idx_properties_source_collaborator ON properties(source_collaborator_id);
CREATE INDEX idx_clients_source_collaborator ON clients(source_collaborator_id);
CREATE INDEX idx_properties_source_type ON properties(source_type);
CREATE INDEX idx_clients_source_type ON clients(source_type);
```

### 3. **Add Views for Common Queries**
```sql
-- Properties with collaborator details
CREATE VIEW properties_with_collaborators AS
SELECT 
  p.*,
  c.name as collaborator_name,
  c.company_name as collaborator_company,
  c.type as collaborator_type
FROM properties p
LEFT JOIN collaborators c ON p.source_collaborator_id = c.id;

-- Clients with collaborator details
CREATE VIEW clients_with_collaborators AS
SELECT 
  cl.*,
  c.name as collaborator_name,
  c.company_name as collaborator_company,
  c.type as collaborator_type
FROM clients cl
LEFT JOIN collaborators c ON cl.source_collaborator_id = c.id;
```

## UI/UX Improvements

1. **Add Quick Actions**
   - "Add Property" button in CollaboratorDetail screen
   - "Add Client" button in CollaboratorDetail screen
   - These should navigate to Add screens with collaboratorId pre-filled

2. **Relationship Indicators**
   - Show badges or icons indicating source type in list views
   - Display collaborator avatars/initials in property/client cards

3. **Navigation Shortcuts**
   - Make collaborator names clickable to navigate to their detail page
   - Add breadcrumb navigation showing relationships

## Testing Checklist

- [ ] Test property creation with each source type
- [ ] Test client creation with each source type
- [ ] Verify collaborator filtering works correctly
- [ ] Test pre-selection when navigating from collaborator detail
- [ ] Verify form validation with invalid combinations
- [ ] Test on both iOS and Android platforms
- [ ] Verify picker styling on both platforms
- [ ] Test with empty collaborator lists
- [ ] Test editing existing properties/clients with sources

## Next Steps

1. Implement the Edit screens with the same dropdown logic
2. Create the developer projects module
3. Update list views to show relationship information
4. Add filtering capabilities to the services layer
5. Implement the remaining relationship dropdowns in Deals, Tasks, and Contact History modules