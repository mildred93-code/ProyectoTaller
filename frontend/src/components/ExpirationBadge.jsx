import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

/**
 * Insignia semafórica de caducidad para farmacia.
 * Utiliza colores sólidos y tonos suaves sin color negro.
 */
export default function ExpirationBadge({ status, expirationDate, showDays = false }) {
  let daysDiff = null;
  if (expirationDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expirationDate);
    exp.setHours(0, 0, 0, 0);
    daysDiff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  }

  const normalizedStatus = status ? status.toUpperCase() : 'VIGENTE';

  // CADUCADO: Alerta sanitaria roja suave
  if (normalizedStatus === 'CADUCADO' || (daysDiff !== null && daysDiff < 0)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFEAEA] text-[#A82828] border border-[#FFBFBF] shadow-sm">
        <ShieldAlert className="w-3.5 h-3.5 text-[#C43232] flex-shrink-0" />
        <span>Caducado</span>
        {showDays && daysDiff !== null && (
          <span className="text-[#C43232] font-semibold text-[11px]">({Math.abs(daysDiff)} d vencido)</span>
        )}
      </span>
    );
  }

  // POR VENCER: Precaución preventiva (≤ 90 días) en tono ámbar suave
  if (normalizedStatus === 'POR_VENCER' || (daysDiff !== null && daysDiff >= 0 && daysDiff <= 90)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF2D6] text-[#995C00] border border-[#FFE0A3] shadow-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] flex-shrink-0" />
        <span>Por Vencer</span>
        {showDays && daysDiff !== null && (
          <span className="text-[#995C00] font-semibold text-[11px]">({daysDiff} d restantes)</span>
        )}
      </span>
    );
  }

  // VIGENTE: Estado óptimo con color sólido #94FFEA y texto verde azulado #0D6E58
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#94FFEA] text-[#0D6E58] border border-[#7EFBE2] shadow-sm">
      <CheckCircle2 className="w-3.5 h-3.5 text-[#0D6E58] flex-shrink-0" />
      <span>Vigente</span>
      {showDays && daysDiff !== null && (
        <span className="text-[#0D6E58] font-semibold text-[11px]">({daysDiff} d)</span>
      )}
    </span>
  );
}
