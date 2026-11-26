import { AssistantProvider } from "@/components/assistant/assistant-context";
import { AssistantLauncher } from "@/components/assistant/assistant-launcher";
import { AppFooter, AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthGate } from "@/components/layout/auth-gate";
import { CourseTintProvider } from "@/components/shared/course-tints";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGate>
      <AssistantProvider>
        <CourseTintProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex min-h-svh flex-col md:peer-data-[variant=inset]:rounded-2xl md:peer-data-[variant=inset]:shadow-soft">
              <AppHeader />
              {/* Bottom clearance keeps the last content clear of the floating assistant launcher. */}
              <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 pt-2 pb-28 md:px-8">{children}</main>
              <AppFooter />
            </SidebarInset>
          </SidebarProvider>
        </CourseTintProvider>
        <AssistantLauncher />
      </AssistantProvider>
    </AuthGate>
  );
}
