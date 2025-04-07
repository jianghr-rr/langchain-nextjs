import { Sidebar } from 'flowbite-react';
import { usePathname, useRouter } from 'next/navigation';
import type { FC } from 'react';

interface SideBarProps {
  links: {
    label: string;
    href: string;
    children?: {
      label: string;
      href: string;
      children?: {
        label: string;
        href: string;
      }[];
    }[];
  }[];
  direction?: string;
}

const RecursiveNavigation: FC<SideBarProps> = ({ links }) => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      {links.map((link, index) => {
        if (link.children) {
          return (
            <Sidebar.Collapse
              key={`${link.href}-${index}`}
              label={link.label}
              onClick={() => router.push(link.href)}
              open
            >
              <RecursiveNavigation links={link.children} />
            </Sidebar.Collapse>
          );
        }
        return (
          <Sidebar.Item
            key={`${link.href}-${index}`}
            onClick={() => router.push(link.href)}
            active={pathname?.includes(link.href)}
          >
            {link.label}
          </Sidebar.Item>
        );
      })}
    </>
  );
};

const SideBar: FC<SideBarProps> = ({ links }) => {
  return (
    <Sidebar aria-label="Sidebar with multi-level dropdown example">
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <RecursiveNavigation links={links} />
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
};

export default SideBar;
export { SideBar };
