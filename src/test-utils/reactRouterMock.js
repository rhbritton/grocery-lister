import React from 'react';

export const BrowserRouter = ({ children }) => <div>{children}</div>;
export const MemoryRouter = ({ children }) => <div>{children}</div>;
export const Routes = ({ children }) => <div>{children}</div>;
export const Route = ({ element }) => element ?? null;
export const NavLink = ({ children, to, ...rest }) => (
  <a href={to} {...rest}>
    {children}
  </a>
);
export const Link = ({ children, to, ...rest }) => (
  <a href={to} {...rest}>
    {children}
  </a>
);
export const Navigate = () => null;
export const useLocation = () => ({ pathname: '/recipes' });
export const useNavigate = () => jest.fn();
export const useParams = () => ({});
export const useSearchParams = () => [new URLSearchParams()];
