import Background from "@/components/ui/Background";
import Nav from "@/components/Nav";
import LoginForm from "@/components/LoginForm";
import { C, SANS } from "@/lib/constants";

export default function LoginPage() {
  return (
    <div style={{ color: C.cream, ...SANS }}>
      <Background />
      <Nav />
      <LoginForm />
    </div>
  );
}
