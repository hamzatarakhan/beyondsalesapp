import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Prototype only — no real device APIs are reachable from a web app, so these mirror
// the design mock's example values.
const DEVICE_INFO = {
  deviceId: "6h3d9k5f665rff",
  androidVersion: "31",
  deviceModel: "Samsung S23 Ultra",
};

const CODE_LENGTH = 5;
const RESEND_SECONDS = 30;

const DeviceRegistration = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!verifyOpen) return;
    setCode(Array(CODE_LENGTH).fill(""));
    setSecondsLeft(RESEND_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [verifyOpen]);

  useEffect(() => {
    if (code.every((d) => d !== "")) {
      const timer = setTimeout(() => {
        setVerifyOpen(false);
        setSuccessOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [code]);

  useEffect(() => {
    if (!successOpen) return;
    const timer = setTimeout(() => navigate("/login", { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [successOpen, navigate]);

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    if (d && i < CODE_LENGTH - 1) {
      const el = document.getElementById(`device-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resend = () => setSecondsLeft(RESEND_SECONDS);

  return (
    <div className="mobile-container min-h-screen bg-background">
      <AppHeader
        title={t("deviceRegistration.title")}
        showBack
        onBackClick={() => navigate("/login")}
      />

      <div className="px-4 pb-28 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("deviceRegistration.userName")}</label>
          <Input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={t("deviceRegistration.userNamePlaceholder")}
            className="h-12 bg-card rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("deviceRegistration.password")}</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("deviceRegistration.passwordPlaceholder")}
              className="h-12 bg-card rounded-xl pe-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("settings.hidePin") : t("settings.showPin")}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("deviceRegistration.phoneNumber")}</label>
          <PhoneNumberInput value={phoneNumber} onChange={setPhoneNumber} />
        </div>

        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-semibold text-foreground">{t("deviceRegistration.deviceInfo")}</h3>
          <div className="bg-card rounded-2xl border border-border/60 divide-y divide-border/60">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">{t("deviceRegistration.deviceId")}</span>
              <span className="text-sm font-medium text-foreground">{DEVICE_INFO.deviceId}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">{t("deviceRegistration.androidVersion")}</span>
              <span className="text-sm font-medium text-foreground">{DEVICE_INFO.androidVersion}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">{t("deviceRegistration.deviceModel")}</span>
              <span className="text-sm font-medium text-foreground">{DEVICE_INFO.deviceModel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 start-0 end-0 max-w-[390px] mx-auto px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <button
          type="button"
          onClick={() => setVerifyOpen(true)}
          className="w-full h-12 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-base"
        >
          {t("deviceRegistration.registerButton")}
        </button>
      </div>

      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <h3 className="font-semibold text-foreground text-lg">{t("deviceRegistration.verifyTitle")}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">{t("deviceRegistration.verifySubtitle")}</p>
          <div className="flex gap-3 justify-center" dir="ltr">
            {code.map((d, i) => (
              <input
                key={i}
                id={`device-otp-${i}`}
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                className="w-12 h-12 rounded-xl border border-border bg-card text-center text-lg font-semibold text-foreground focus:outline-none focus:border-primary"
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-5">
            {t("deviceRegistration.didntReceiveCode")}{" "}
            {secondsLeft > 0 ? (
              <span className="font-semibold text-foreground">00:{String(secondsLeft).padStart(2, "0")}</span>
            ) : (
              <button type="button" onClick={resend} className="font-semibold text-primary">
                {t("deviceRegistration.resend")}
              </button>
            )}
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-8 text-center [&>button]:hidden">
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" strokeWidth={2} />
            <h3 className="font-semibold text-foreground text-lg">{t("deviceRegistration.successTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("deviceRegistration.successDesc")}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeviceRegistration;
