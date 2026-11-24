import { createLayout } from '@remkoj/optimizely-cms-nextjs/page';
import { channelId as channel } from '@/api';

const { PageLayout, generateMetadata } = createLayout({ channel });

export { generateMetadata }

export default PageLayout;
