// src/screens/properties/AddPropertyScreen/hooks/usePropertySourceLogic.ts

import { useEffect, useState } from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { PropertyFormData, Collaborator } from '../screens/properties/AddPropertyScreen/AddPropertyScreen.types';

interface UsePropertySourceLogicProps {
  sourceType: string | null;
  collaborators: Collaborator[];
  setValue: UseFormSetValue<PropertyFormData>;
  watch: UseFormWatch<PropertyFormData>;
  collaboratorId?: string;
}

export const usePropertySourceLogic = ({
  sourceType,
  collaborators,
  setValue,
  watch,
  collaboratorId,
}: UsePropertySourceLogicProps) => {
  const [filteredCollaborators, setFilteredCollaborators] = useState<Collaborator[]>([]);

  // Filter collaborators based on source type
  useEffect(() => {
    if (!sourceType) {
      setFilteredCollaborators([]);
      setValue('source_collaborator_id', null);
      return;
    }

    let filtered: Collaborator[] = [];
    
    switch (sourceType) {
      case 'landlord':
        filtered = collaborators.filter(c => c.type === 'landlord');
        break;
      case 'developer':
        filtered = collaborators.filter(c => c.type === 'developer');
        break;
      case 'partner':
        filtered = collaborators.filter(c => c.type === 'agency' || c.type === 'other');
        break;
    }
    
    setFilteredCollaborators(filtered);
    
    // Reset collaborator selection if current selection is not in filtered list
    const currentCollaboratorId = watch('source_collaborator_id');
    if (currentCollaboratorId && !filtered.find(c => c.id === currentCollaboratorId)) {
      setValue('source_collaborator_id', null);
    }
  }, [sourceType, collaborators, setValue, watch]);

  // Set initial source type if collaboratorId is provided
  useEffect(() => {
    if (collaboratorId) {
      const collaborator = collaborators.find(c => c.id === collaboratorId);
      if (collaborator) {
        // Set source type based on collaborator type
        if (collaborator.type === 'landlord') {
          setValue('source_type', 'landlord');
        } else if (collaborator.type === 'developer') {
          setValue('source_type', 'developer');
        } else if (collaborator.type === 'agency' || collaborator.type === 'other') {
          setValue('source_type', 'partner');
        }
        setValue('source_collaborator_id', collaboratorId);
      }
    }
  }, [collaboratorId, collaborators, setValue]);

  return {
    filteredCollaborators,
  };
};

