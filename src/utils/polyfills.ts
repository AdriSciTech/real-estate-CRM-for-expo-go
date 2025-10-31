// src/utils/polyfills.ts

// Import this FIRST - critical for Supabase
import 'react-native-get-random-values';

// Declare global types
declare global {
  interface Global {
    structuredClone?: <T>(obj: T) => T;
    TextEncoder?: typeof TextEncoder;
    TextDecoder?: typeof TextDecoder;
    btoa?: (str: string) => string;
    atob?: (b64Encoded: string) => string;
    crypto?: {
      getRandomValues?: (array: Uint8Array) => Uint8Array;
      subtle?: any;
    };
    Buffer?: any;
  }
}

// Polyfill for structuredClone (your existing one)
if (!global.structuredClone) {
  global.structuredClone = function structuredClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Polyfill for TextEncoder/TextDecoder - needed for Supabase auth
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str: string): Uint8Array {
      const utf8 = unescape(encodeURIComponent(str));
      const result = new Uint8Array(utf8.length);
      for (let i = 0; i < utf8.length; i++) {
        result[i] = utf8.charCodeAt(i);
      }
      return result;
    }
  } as any;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(uint8Array: Uint8Array): string {
      let str = '';
      for (let i = 0; i < uint8Array.length; i++) {
        str += String.fromCharCode(uint8Array[i]);
      }
      return decodeURIComponent(escape(str));
    }
  } as any;
}

// Polyfill for btoa/atob - needed for base64 encoding in Supabase
if (typeof global.btoa === 'undefined') {
  const Buffer = require('buffer').Buffer;
  global.btoa = function(str: string): string {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

if (typeof global.atob === 'undefined') {
  const Buffer = require('buffer').Buffer;
  global.atob = function(b64Encoded: string): string {
    return Buffer.from(b64Encoded, 'base64').toString('binary');
  };
}

// Polyfill for crypto - needed for Supabase authentication
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: function<T extends ArrayBufferView | null>(array: T): T {
      if (!array) return array;
      const uint8Array = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      for (let i = 0; i < uint8Array.length; i++) {
        uint8Array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    subtle: {}
  } as any;
} else {
  // This is handled by react-native-get-random-values, but adding fallback
  if (typeof global.crypto.getRandomValues === 'undefined') {
    global.crypto.getRandomValues = function<T extends ArrayBufferView | null>(array: T): T {
      if (!array) return array;
      const uint8Array = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      for (let i = 0; i < uint8Array.length; i++) {
        uint8Array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }

  // Polyfill for crypto.subtle - needed for some Supabase operations
  if (typeof global.crypto.subtle === 'undefined') {
    Object.defineProperty(global.crypto, 'subtle', {
      value: {},
      writable: true,
      configurable: true
    });
  }
}

// Add Buffer polyfill if not available
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// URL and URLSearchParams polyfills are handled by react-native-url-polyfill/auto
// which you're already importing in App.tsx

console.log('Polyfills loaded successfully');

export {}; // Make this a module