jest.setTimeout(20000);

import { TextEncoder, TextDecoder } from "util";
import "@testing-library/jest-dom";

// Polyfills for jsdom environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Ensure __dirname is defined in ESM context
global.__dirname = process.cwd();