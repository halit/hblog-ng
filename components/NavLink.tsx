'use client';

import React from 'react';
import Link from 'next/link';
import { VaultNode } from '../types/vault';
import { getPathFromId } from '../lib/routing';

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  id: string;
  node?: VaultNode;
  className?: string;
  children: React.ReactNode;
}

export const NavLink: React.FC<NavLinkProps> = ({
  id,
  node,
  className = '',
  children,
  ...props
}) => {
  const path = getPathFromId(id, node);

  return (
    <Link href={path} className={className} prefetch={false} {...props}>
      {children}
    </Link>
  );
};
