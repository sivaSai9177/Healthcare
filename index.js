// Polyfills must be first
import './polyfills';
// Initialize web platform mocks before anything else
import '@/lib/core/platform/web-init';
import 'expo-router/entry';