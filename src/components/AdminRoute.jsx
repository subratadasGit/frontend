import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { Btn, EmptyState, Page, PageHeader } from "./ui/AppUI";

/**
 * Guards the CMS.
 *
 * Signed-out visitors go to the login screen exactly as `ProtectedRoute` sends
 * them; signed-in non-admins get told why they cannot be here rather than
 * being bounced somewhere confusing. This is presentation only — the API
 * enforces the same rule in `requireAdmin`, so hiding the screen is a
 * courtesy, not the security boundary.
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <Page>
        <PageHeader
          eyebrow="CMS"
          title="Administrators only"
          description="Site content is managed by administrators. Your account does not have that role."
          actions={
            <Btn to="/app" variant="ghost">
              Back to workspace
            </Btn>
          }
        />
        <EmptyState
          title="You do not have access to the CMS."
          description="If you should be an administrator, ask whoever runs this deployment to add your email to ADMIN_EMAILS, then sign out and back in."
          action={<Btn to="/app">Go to workspace</Btn>}
        />
      </Page>
    );
  }

  return children;
}
