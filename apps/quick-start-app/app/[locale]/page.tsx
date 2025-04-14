import dynamic from 'next/dynamic';

const HomeAnimated = dynamic(() => import('~/components/home-animated'));

export default function Home() {
  return <HomeAnimated />;
}