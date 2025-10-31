// src/screens/properties/AddPropertyScreen/components/PropertyForm/styles.ts

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#43484d',
    marginTop: 20,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#86939e',
    marginBottom: 10,
    marginLeft: 10,
  },
  buttonGroup: {
    borderRadius: 8,
    marginBottom: 20,
  },
  selectedButton: {
    backgroundColor: '#2089dc',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  switchLabel: {
    fontSize: 16,
    color: '#43484d',
  },
  submitButton: {
    borderRadius: 25,
    paddingVertical: 15,
    backgroundColor: '#2089dc',
    marginTop: 30,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#86939e',
    marginBottom: 10,
    marginLeft: 10,
  },
  picker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginHorizontal: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#86939e',
    marginTop: 5,
    marginLeft: 10,
    fontStyle: 'italic',
  },
});
