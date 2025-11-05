export type Domain = {
  id: string;
  name: string;
  endpoint: string;
  description: string;
};

export const DOMAINS: Domain[] = [
  {
    id: 'vision-pro',
    name: 'Vision Pro',
    endpoint: 'https://api.example.com/vision/pro',
    description: 'High fidelity scene understanding for enterprise use cases.'
  },
  {
    id: 'vision-lite',
    name: 'Vision Lite',
    endpoint: 'https://api.example.com/vision/lite',
    description: 'Cost-efficient model optimized for rapid prototyping.'
  },
  {
    id: 'vision-medical',
    name: 'Vision Medical',
    endpoint: 'https://api.example.com/vision/medical',
    description: 'Specialized diagnostics tuned for medical imaging workflows.'
  }
];
