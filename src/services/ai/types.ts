export type AlertKind =
  | "pattern_estructural_activo"
  | "estancamiento_intencion"
  | "silencio_prolongado";

export type Alert = {
  id: string;
  kind: AlertKind;
  title: string;
  detail: string;
  ctaLabel: string;
  ctaTo: string;
  patternId?: string;
};

