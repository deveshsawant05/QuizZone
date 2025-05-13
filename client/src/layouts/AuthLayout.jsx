import React from 'react';
import { Outlet } from 'react-router-dom';

// We won't need this layout's content since we've moved it to the AuthCard component
const AuthLayout = () => {
  return <Outlet />;
};

export default AuthLayout; 