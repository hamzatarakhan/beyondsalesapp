import { useCallback, useEffect, useRef, useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, UploadCloud, X } from "lucide-react";

export const SignatureBox = ({
  title,
  value,
  onEdit,
  onClear,
  required = false,
}: {
  title: string;
  value: string | null;
  onEdit: () => void;
  onClear: () => void;
  required?: boolean;
}) => (
  <section>
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-semibold text-foreground">
        {title}
        {required && <span className="text-destructive"> *</span>}
      </h3>
      {value && (
        <button
          onClick={onEdit}
          className="text-xs text-primary font-semibold flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Change
        </button>
      )}
    </div>
    {value ? (
      <button
        onClick={onEdit}
        className="w-full bg-card rounded-2xl p-3 border border-border shadow-sm flex items-center justify-center"
      >
        <img src={value} alt={`${title} preview`} className="h-28 w-full object-contain" />
      </button>
    ) : (
      <button
        onClick={onEdit}
        className="w-full border-2 border-dashed border-border rounded-2xl bg-card py-8 flex flex-col items-center gap-2 active:bg-primary/5 transition-colors"
      >
        <span className="w-9 h-9 rounded-full border-2 border-primary flex items-center justify-center text-primary">
          <Plus className="w-4 h-4" />
        </span>
        <p className="text-sm text-muted-foreground">Upload your signature here</p>
      </button>
    )}
  </section>
);

export const SignaturePadSheet = ({
  open,
  title,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  initial: string | null;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const hasInkRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const markHasInk = useCallback((value: boolean) => {
    hasInkRef.current = value;
    setHasInk(value);
  }, []);

  const configureContext = useCallback((ctx: CanvasRenderingContext2D, dpr: number) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineWidth = 2.5 * dpr;
  }, []);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const dpr = window.devicePixelRatio || 1;
      const prev = canvas.toDataURL("image/png");
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return true;
      configureContext(ctx, dpr);
      const source = initial || (hasInkRef.current ? prev : null);
      if (source) {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
        img.src = source;
        if (initial) markHasInk(true);
      }
      return true;
    };
    markHasInk(!!initial);
    let raf = 0;
    const tick = () => { if (!setup()) raf = requestAnimationFrame(tick); };
    tick();
    const ro = new ResizeObserver(() => setup());
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [open, initial, configureContext, markHasInk]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const drawTo = (p: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas || !lastRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = getPos(e);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !lastRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    events.forEach((ev) => {
      drawTo({
        x: (ev.clientX - rect.left) * (canvas.width / rect.width),
        y: (ev.clientY - rect.top) * (canvas.height / rect.height),
      });
    });
    if (!hasInkRef.current) markHasInk(true);
  };
  const end = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e?.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    drawingRef.current = false;
    lastRef.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    markHasInk(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    onSave(canvas.toDataURL("image/png"));
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        markHasInk(true);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2 max-h-[92vh]">
        <button
          onClick={onClose}
          className="absolute right-4 top-5 w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>
        <div className="text-center px-8 mb-4">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please add your signature in the box below.
          </p>
        </div>
        <div className="relative rounded-2xl bg-muted/40 mb-5 flex-1 min-h-[360px]">
          <label className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 px-3 h-8 rounded-full border border-primary text-primary text-xs font-semibold bg-card cursor-pointer">
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Signature
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          <canvas
            ref={canvasRef}
            className="w-full h-full absolute inset-0 rounded-2xl touch-none"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onPointerLeave={end}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={save}
            disabled={!hasInk}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-base"
          >
            Apply
          </Button>
          <button
            type="button"
            onClick={hasInk ? clear : onClose}
            className="w-full h-11 text-primary font-semibold text-base"
          >
            {hasInk ? "Clear" : "Cancel"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};