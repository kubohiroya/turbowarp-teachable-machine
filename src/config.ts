export const extensionConfig = {
  id: 'kubohiroyatm',
  slug: 'tm',
  name: 'Teachable Machine',
  description: 'Use Teachable Machine pose, image, or audio models for recognition in TurboWarp.',
  author: 'Hiroya Kubo',
  license: 'MPL-2.0',
  unsandboxed: true,
  blockIconURI: `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="15" r="4" fill="#4C97FF"/><path d="M24 20v10M24 23l-7 4M24 23l7 4M24 30l-5 9M24 30l5 9" fill="none" stroke="#4C97FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 15V9h6M39 15V9h-6M9 33v6h6M39 33v6h-6" fill="none" stroke="#59C059" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  )}`,
} as const;
