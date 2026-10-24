export type Item = {
  id: string;
  title: string;
  description: string;
};

/** In-memory dummy data. Swap for Prisma/Neon via src/db when DATABASE_URL is set. */
export const publicItems: Item[] = [
  {
    id: '1',
    title: 'Deploy from day one',
    description: 'Infrastructure and app ship together via CDK.',
  },
  {
    id: '2',
    title: 'Same-origin API',
    description: 'CloudFront routes /api/* to Lambda behind an origin secret.',
  },
  {
    id: '3',
    title: 'Public and private routes',
    description: 'Open pages for everyone; Cognito JWT for user-specific data.',
  },
];
