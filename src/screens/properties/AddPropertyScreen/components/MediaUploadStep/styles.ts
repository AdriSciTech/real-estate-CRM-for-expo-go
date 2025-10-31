// src/screens/properties/AddPropertyScreen/components/MediaUploadStep/styles.ts

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  successCard: {
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#43484d',
    marginTop: 10,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#86939e',
    marginTop: 5,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#43484d',
    marginTop: 20,
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#86939e',
    marginBottom: 15,
    marginLeft: 10,
  },
  buttonContainer: {
    marginTop: 30,
    gap: 15,
  },
  secondaryButton: {
    borderRadius: 25,
    paddingVertical: 15,
    borderColor: '#2089dc',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2089dc',
  },
  submitButton: {
    borderRadius: 25,
    paddingVertical: 15,
    backgroundColor: '#2089dc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});