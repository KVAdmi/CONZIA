import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import { useConzia } from "../state/conziaStore";

export default function RegistroPage() {
  const navigate = useNavigate();
  const { dispatch } = useConzia();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Datos de registro
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");

  // Datos de proyección (Sombra)
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");

  const canGoNext = () => {
    if (step === 1) return email && password && nombre;
    if (step === 2) return p1.length >= 80 && p2.length >= 80 && p3.length >= 80;
    return true;
  };

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else handleFinalize();
  };

  const handleFinalize = async () => {
    setLoading(true);
    // Simulamos el proceso de registro y análisis
    setTimeout(() => {
      dispatch({ 
        type: "SET_USER", 
        payload: { 
          id: "user_" + Math.random().toString(36).substr(2, 9), 
          email, 
          nombre, 
          status: "inactivo",
          registrationDone: true
        } 
      });
      navigate("/pago");
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center px-6 pb-10 pt-14 bg-conzia-light relative overflow-hidden">
      {/* Fondo con degradado sutil y profesional */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#F4F6F8] to-[#F4F6F8] opacity-100" />
      
      <div className="w-full max-w-xl z-10">
        <div className="flex flex-col items-center mb-8">
          <motion.img 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            src="/brand/conzia-logo.png" 
            alt="CONZIA Logo" 
            className="w-24 h-auto object-contain mb-6 opacity-90"
          />
          <div className="flex gap-2 mb-4">
            {[1, 2].map((i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-500 ${
                  step >= i ? "w-8 bg-camel" : "w-2 bg-conzia-muted/10"
                }`} 
              />
            ))}
          </div>
          <h1 className="text-lg font-bold text-conzia-dark uppercase tracking-[0.2em]">
            {step === 1 ? "Crea tu cuenta" : "Inicia tu Diagnóstico"}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
            >
              <Card className="p-8 bg-white/90 backdrop-blur-xl border-white/50 shadow-xl rounded-3xl">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-conzia-dark/50 ml-1 uppercase tracking-widest">Nombre Completo</label>
                    <Input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre"
                      className="mt-2 bg-conzia-light/30 border-conzia-muted/10 text-conzia-dark placeholder:text-conzia-muted/30 rounded-xl py-3.5 focus:ring-camel/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-conzia-dark/50 ml-1 uppercase tracking-widest">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="mt-2 bg-conzia-light/30 border-conzia-muted/10 text-conzia-dark placeholder:text-conzia-muted/30 rounded-xl py-3.5 focus:ring-camel/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-conzia-dark/50 ml-1 uppercase tracking-widest">Contraseña</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-2 bg-conzia-light/30 border-conzia-muted/10 text-conzia-dark placeholder:text-conzia-muted/30 rounded-xl py-3.5 focus:ring-camel/20"
                    />
                  </div>
                  <Button
                    onClick={handleNext}
                    disabled={!canGoNext()}
                    className="w-full mt-4 py-4 bg-camel hover:bg-camel/90 text-white font-bold rounded-2xl shadow-lg shadow-camel/10 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    Siguiente paso
                  </Button>

                  <div className="pt-4 text-center">
                    <p className="text-conzia-muted/60 text-xs font-medium">
                      ¿Ya tienes cuenta?{" "}
                      <Link to="/login" className="text-camel hover:text-conzia-dark font-bold transition-colors">
                        Inicia sesión
                      </Link>
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
            >
              <Card className="p-8 bg-white/90 backdrop-blur-xl border-white/50 shadow-xl rounded-3xl">
                <p className="text-conzia-gray/60 text-xs mb-8 text-center italic font-light leading-relaxed">
                  "Para encontrar tu sombra, debemos mirar hacia afuera..."
                </p>
                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-bold text-conzia-dark/50 ml-1 uppercase tracking-widest leading-relaxed block">
                      1. ¿Qué es lo que más te irrita de los demás?
                    </label>
                    <Textarea
                      value={p1}
                      onChange={(e) => setP1(e.target.value)}
                      placeholder="Describe ese rasgo que no soportas..."
                      className="mt-3 bg-conzia-light/30 border-conzia-muted/10 text-conzia-dark placeholder:text-conzia-muted/30 rounded-xl min-h-[100px] p-4 focus:ring-camel/20"
                    />
                    <p className="text-[9px] text-right mt-2 font-bold text-conzia-muted/40 tracking-widest">
                      {p1.length}/80 CARACTERES MÍN.
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-conzia-dark/50 ml-1 uppercase tracking-widest leading-relaxed block">
                      2. ¿A quién admiras y qué te hace sentir pequeño?
                    </label>
                    <Textarea
                      value={p2}
                      onChange={(e) => setP2(e.target.value)}
                      placeholder="Describe esa admiración que duele..."
                      className="mt-3 bg-conzia-light/30 border-conzia-muted/10 text-conzia-dark placeholder:text-conzia-muted/30 rounded-xl min-h-[100px] p-4 focus:ring-camel/20"
                    />
                    <p className="text-[9px] text-right mt-2 font-bold text-conzia-muted/40 tracking-widest">
                      {p2.length}/80 CARACTERES MÍN.
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-conzia-dark/50 ml-1 uppercase tracking-widest leading-relaxed block">
                      3. ¿Qué máscara usas para ser aceptado?
                    </label>
                    <Textarea
                      value={p3}
                      onChange={(e) => setP3(e.target.value)}
                      placeholder="¿Cómo te muestras al mundo para encajar?"
                      className="mt-3 bg-conzia-light/30 border-conzia-muted/10 text-conzia-dark placeholder:text-conzia-muted/30 rounded-xl min-h-[100px] p-4 focus:ring-camel/20"
                    />
                    <p className="text-[9px] text-right mt-2 font-bold text-conzia-muted/40 tracking-widest">
                      {p3.length}/80 CARACTERES MÍN.
                    </p>
                  </div>
                  <Button
                    onClick={handleNext}
                    disabled={!canGoNext() || loading}
                    className="w-full mt-4 py-4 bg-conzia-dark hover:bg-conzia-dark/90 text-white font-bold rounded-2xl shadow-lg shadow-conzia-dark/10 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {loading ? "Analizando..." : "Finalizar Diagnóstico"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
