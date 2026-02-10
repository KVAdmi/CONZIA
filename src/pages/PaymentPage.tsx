import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useConzia } from "../state/conziaStore";

type PlanId = "plus" | "premium";

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  duration: string;
  features: string[];
  isPopular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "plus",
    name: "Plan Plus",
    price: "$199 MXN",
    duration: "7 días de acceso",
    features: [
      "Desahogo diario ilimitado (Texto)",
      "1 Interpretación visual de sueños",
      "Análisis básico de arquetipos",
      "1 Reto diario personalizado",
    ],
  },
  {
    id: "premium",
    name: "Plan Premium",
    price: "$249 MXN",
    duration: "30 días de acceso",
    features: [
      "Desahogo ilimitado (Texto + Voz)",
      "Interpretaciones de sueños ilimitadas",
      "Evolución detallada de arquetipos",
      "Retos avanzados y seguimiento",
    ],
    isPopular: true,
  },
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const { dispatch } = useConzia();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("premium");
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    setLoading(true);
    // Simulación de integración con IAP (Apple/Google)
    // En una app real, aquí se llamaría a la librería de compras nativas
    setTimeout(() => {
      dispatch({ type: "update_profile", patch: { registrationDone: true } });
      setLoading(false);
      navigate("/sesion");
    }, 2000);
  }

  return (
    <div className="min-h-[100svh] bg-[#0b1220] px-6 pb-12 pt-16 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-camel/10 rounded-full blur-[100px]" />
      
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold text-white tracking-tight">Elige tu camino</h1>
          <p className="text-white/60 mt-2 text-sm">Invierte en tu sanación y descubre tu sombra.</p>
        </motion.div>

        <div className="w-full max-w-md space-y-6">
          {PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, x: plan.id === "plus" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative cursor-pointer transition-all duration-300 ${
                selectedPlan === plan.id ? "scale-[1.02]" : "scale-100 opacity-70"
              }`}
            >
              <Card className={`p-6 backdrop-blur-2xl border-white/10 ${
                selectedPlan === plan.id 
                  ? "bg-white/10 ring-2 ring-camel shadow-[0_0_30px_rgba(193,154,107,0.2)]" 
                  : "bg-white/5"
              }`}>
                {plan.isPopular && (
                  <div className="absolute -top-3 right-6 bg-camel text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                    Recomendado
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-camel font-medium text-sm">{plan.duration}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{plan.price}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                      <svg className="w-4 h-4 text-camel shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md mt-10"
        >
          <Button
            variant="primary"
            className="w-full py-5 bg-camel hover:bg-camel/90 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98]"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? "Procesando..." : `Suscribirse ahora`}
          </Button>
          
          <p className="text-center text-white/30 text-[10px] mt-6 leading-relaxed px-8">
            Al suscribirte, aceptas los Términos de Servicio y la Política de Privacidad. 
            La suscripción se gestionará a través de tu cuenta de App Store o Google Play.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
