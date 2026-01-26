import React, { createContext, useContext, useState, ReactNode } from "react";

type UserRole = "parent" | "child";

interface UserRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isParent: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>("parent");

  return (
    <UserRoleContext.Provider value={{ role, setRole, isParent: role === "parent" }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return context;
};
