import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole: "caretaker" | "patient";
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, role, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to={`/${requiredRole}/login`} replace />;
    }

    if (role && role !== requiredRole) {
        // Redirect to the correct dashboard based on their actual role
        if (role === 'caretaker') return <Navigate to="/caretaker/dashboard" replace />;
        if (role === 'patient') return <Navigate to="/patient/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
}
