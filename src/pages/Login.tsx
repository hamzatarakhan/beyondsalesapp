import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import BeyondOneLogo from "@/components/BeyondOneLogo";

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // login() flips auth state and raises loginTransition, which an App-level overlay
  // (mounted above the router, so it survives this navigation) picks up to play the
  // loader on top of the Home page underneath.
  const handleLogin = () => {
    login();
    navigate("/", { replace: true });
  };

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col px-6 pt-32 pb-10">
      <BeyondOneLogo className="h-14 w-auto mx-auto text-[#000B25] dark:text-white" />
      <p className="text-center text-sm text-muted-foreground mt-4">{t("login.welcome")}</p>

      <div className="mt-10 space-y-3">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("login.usernamePlaceholder")}
          className="h-12 rounded-2xl bg-card px-4"
        />
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.passwordPlaceholder")}
            className="h-12 rounded-2xl bg-card px-4 pe-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("settings.hidePin") : t("settings.showPin")}
            className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button type="button" className="self-end mt-3 text-sm font-medium text-foreground">
        {t("login.forgetPassword")}
      </button>

      <button
        type="button"
        onClick={handleLogin}
        className="mt-6 h-12 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-base"
      >
        {t("login.loginButton")}
      </button>
      <button
        type="button"
        onClick={() => navigate("/device-registration")}
        className="mt-3 h-12 rounded-full bg-black/10 dark:bg-white/10 text-foreground font-semibold text-base"
      >
        {t("login.activateDevice")}
      </button>

      <div className="mt-8 mx-auto w-12 h-12 rounded-full bg-white shadow-sm dark:bg-white/10 dark:shadow-none dark:border dark:border-white/20 flex items-center justify-center text-gray-500 dark:text-white/80">
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8.5" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="10" r="1" fill="currentColor" stroke="none" />
          <path d="M8.5 15c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5" />
        </svg>
      </div>

      <div className="mt-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/25 p-3 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">{t("login.prototypeHint")}</p>
      </div>

      <div className="mt-auto pt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span>{t("login.poweredBy")}</span>
        <BeyondOneLogo className="h-3.5 w-auto text-[#000B25] dark:text-white" />
      </div>
    </div>
  );
};

export default Login;
