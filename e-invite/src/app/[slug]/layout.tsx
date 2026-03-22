import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedding Invitation",
  description: "You are cordially invited",
};

export default function InvitationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
