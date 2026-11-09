import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';

const REGION_ID = 'barcode-scanner-region';

// Formatos de código de barras más comunes en medicamentos y empaques
const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

// Traduce los errores de la cámara a mensajes que se entiendan
function friendlyError(err) {
  const name = err?.name || '';
  if (name === 'Insecure') {
    return 'La cámara solo funciona desde http://localhost o desde una dirección HTTPS. Abre el sistema como localhost:5173.';
  }
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || /permission/i.test(String(err))) {
    return 'No se dio permiso para usar la cámara. Permítelo en el candado de la barra de direcciones y vuelve a intentarlo.';
  }
  if (name === 'NotFoundError' || name === 'NoCamera') {
    return 'No se encontró ninguna cámara en este equipo.';
  }
  if (name === 'NotReadableError') {
    return 'La cámara está siendo usada por otra aplicación. Ciérrala e inténtalo de nuevo.';
  }
  return 'No se pudo iniciar la cámara. Puedes escribir el código a mano o usar un lector USB.';
}

export default function BarcodeScanner({ onDetected, onClose }) {
  const [status, setStatus] = useState('starting'); // 'starting' | 'scanning' | 'error'
  const [error, setError] = useState('');
  const doneRef = useRef(false);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    let cancelled = false;
    let scanner = null;
    let started = false;

    (async () => {
      try {
        if (!window.isSecureContext) throw { name: 'Insecure' };

        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;
        if (!cameras || cameras.length === 0) throw { name: 'NoCamera' };

        // En celular se prefiere la cámara trasera; en laptop se usa la que haya
        const preferred =
          cameras.find((c) => /back|rear|trasera|environment/i.test(c.label)) || cameras[0];

        scanner = new Html5Qrcode(REGION_ID, { formatsToSupport: FORMATS, verbose: false });
        await scanner.start(
          preferred.id,
          { fps: 10, qrbox: { width: 300, height: 150 } },
          (text) => {
            // Puede detectar varias veces el mismo código: solo se avisa la primera
            if (doneRef.current) return;
            doneRef.current = true;
            onDetectedRef.current(text);
          },
          () => {} // errores de "no se ve código en este cuadro": se ignoran
        );
        started = true;

        if (cancelled) {
          await scanner.stop();
          scanner.clear();
          return;
        }
        setStatus('scanning');
      } catch (err) {
        if (!cancelled) {
          setError(friendlyError(err));
          setStatus('error');
        }
      }
    })();

    // Al cerrar se apaga la cámara (si no, la luz de la cámara se queda encendida)
    return () => {
      cancelled = true;
      if (scanner && started) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Escanear código de barras"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E3A5F]/50"
    >
      <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-card border-2 border-[#D8E4F5] overflow-hidden">
        <div className="px-6 py-4 bg-[#EEF4FF] border-b-2 border-[#D8E4F5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#94B2FF] flex items-center justify-center shadow-sm">
              <Camera className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <h3 className="text-base font-extrabold text-[#1E3A5F] tracking-tight">
              Escanear código de barras
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar escáner"
            title="Cerrar escáner"
            className="p-2 rounded-full bg-white hover:bg-[#D8E5FF] border border-[#D8E4F5] text-[#1E3A5F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {status !== 'error' && (
            <>
              <div
                id={REGION_ID}
                className="w-full min-h-[220px] rounded-2xl overflow-hidden bg-[#F8FAFD] border-2 border-[#D8E4F5]"
              />
              <p role="status" className="mt-3 text-xs text-[#456586] font-semibold text-center">
                {status === 'starting'
                  ? 'Iniciando cámara... acepta el permiso si el navegador lo pide.'
                  : 'Acerca el código de barras al cuadro, con buena luz y sin movimiento.'}
              </p>
            </>
          )}

          {status === 'error' && (
            <div role="alert" className="p-4 rounded-2xl bg-[#FFEAEA] border border-[#FFBFBF] text-[#A82828] text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#C43232] flex-shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-[#38577A] hover:text-[#1E3A5F] bg-[#EEF4FF] hover:bg-[#D8E5FF] border border-[#D8E4F5] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
