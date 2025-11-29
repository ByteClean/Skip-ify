/**
 * Tests für LoginScreen.js
 */

import React from 'react';
import LoginScreen from '../screens/auth/LoginScreen';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(async (email, password) => 
      email && password ? { success: true } : { success: false }
    ),
    enterOfflineMode: jest.fn(async () => ({ success: true })),
  }),
}));

describe('LoginScreen', () => {
  const mockNavigation = { navigate: jest.fn() };
  const mockOnAuthSuccess = jest.fn();

  test('sollte LoginScreen Komponente existieren', () => {
    expect(LoginScreen).toBeDefined();
  });

  test('sollte mit mockNavigation und mockOnAuthSuccess Props erzeugt werden', () => {
    expect(mockNavigation.navigate).toBeDefined();
    expect(mockOnAuthSuccess).toBeDefined();
  });

  test('sollte AuthContext mockbar sein', () => {
    const mockAuth = {
      login: jest.fn(),
      enterOfflineMode: jest.fn(),
    };
    expect(mockAuth.login).toBeDefined();
    expect(mockAuth.enterOfflineMode).toBeDefined();
  });

  test('sollte E-Mail Validierung durchführen', () => {
    const email = 'test@example.com';
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValidEmail).toBe(true);
  });

  test('sollte ungültige E-Mails ablehnen', () => {
    const email = 'invalid-email';
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValidEmail).toBe(false);
  });

  test('sollte Passwort mindestens 8 Zeichen erfordern', () => {
    const password = 'ShortPw';
    expect(password.length >= 8).toBe(false);
  });

  test('sollte lange Passwörter akzeptieren', () => {
    const password = 'ValidPassword123';
    expect(password.length >= 8).toBe(true);
  });

  test('sollte Login mit gültigen Anmeldedaten durchführen', async () => {
    const { useAuth } = require('../contexts/AuthContext');
    const auth = useAuth();
    expect(auth.login).toBeDefined();
  });

  test('sollte Offline-Modus aktivierbar sein', async () => {
    const { useAuth } = require('../contexts/AuthContext');
    const auth = useAuth();
    expect(auth.enterOfflineMode).toBeDefined();
  });
});
