import { headers } from 'next/headers';

const getLocale = async (): Promise<string> => {
  const data = await headers();
  const locale = data.get('NEXT_LOCALE');
  if (locale) return locale;
  return 'zh';
};

export default getLocale;
export { getLocale };
