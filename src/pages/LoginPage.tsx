import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { signInWithPassword } from "../services/supabase/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signInWithPassword(email, password);
      if (res.ok) {
        navigate("/sesion");
      } else {
        setError(res.error.message || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center px-6 pb-10 pt-14 bg-conzia-light relative overflow-hidden">
      {/* Fondo con degradado sutil */}
      <div className="absolute inset-0 bg-conzia-gradient opacity-40" />
      
      <div className="w-full max-w-md z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center mb-10"
        >
          <img 
            src="/brand/conzia-logo.png" 
            alt="CONZIA Logo" 
            className="w-36 h-auto object-contain mb-6 drop-shadow-sm"
          />
          <h1 className="text-2xl font-bold text-conzia-dark tracking-tight">Bienvenido de nuevo</h1>
          <p className="text-conzia-gray/60 text-sm mt-2">Continúa tu viaje de introspección</p>
        </motion.div>

        <Card className="p-8 bg-white/80 backdrop-blur-xl border-white shadow-glass rounded-3xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-conzia-dark/70 ml-1 uppercase tracking-wider">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="mt-1.5 bg-conzia-light/50 border-conzia-muted/20 text-conzia-dark placeholder:text-conzia-muted/50 rounded-xl py-3"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-conzia-dark/70 ml-1 uppercase tracking-wider">Contraseña</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 bg-conzia-light/50 border-conzia-muted/20 text-conzia-dark placeholder:text-conzia-muted/50 rounded-xl py-3"
                required
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-xs mt-2 px-1 font-medium"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4 py-4 bg-camel hover:bg-camel/90 text-white font-bold rounded-2xl shadow-lg shadow-camel/20 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar al Consultorio"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-conzia-muted/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="bg-white px-4 text-conzia-muted/60">O continuar con</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-conzia-light/50 border border-conzia-muted/10 rounded-xl text-conzia-dark text-sm font-bold hover:bg-white transition-all shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-conzia-light/50 border border-conzia-muted/10 rounded-xl text-conzia-dark text-sm font-bold hover:bg-white transition-all shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.11.8 1.12-.16 2.26-.9 3.77-.79 1.58.12 2.85.76 3.67 1.98-3.27 1.96-2.76 6.35.5 7.65-.78 1.98-1.81 3.91-3.05 5.33zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-conzia-gray/50 text-sm font-medium">
              ¿No tienes cuenta?{" "}
              <Link to="/onboarding" className="text-camel hover:underline font-bold">
                Comienza tu viaje
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
