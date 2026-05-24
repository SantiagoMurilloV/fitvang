import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import logoComplete from '../../imports/WhatsApp_Image_2026-05-18_at_14.42.49-removebg-preview.png';

export const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/user');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-5">
      <div className="w-full max-w-[390px]">
        <div className="text-center mb-12">
          <img
            src={logoComplete}
            alt="FitVang Logo"
            className="w-64 mx-auto mb-4"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <Input
                type="text"
                placeholder="Nombre completo"
                icon={Mail}
              />
              <Input
                type="tel"
                placeholder="WhatsApp"
                icon={Mail}
              />
            </>
          )}

          <Input
            type="email"
            placeholder="Correo electrónico"
            icon={Mail}
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              icon={Lock}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {!isRegister && (
            <div className="text-right">
              <button type="button" className="text-xs text-[#3DC4DB] hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {isRegister && (
            <div className="space-y-3">
              <p className="text-xs text-[#888888] uppercase font-semibold tracking-wider">
                Selecciona tu plan
              </p>
              <div className="space-y-2">
                {['Básico', 'Full', 'Premium'].map((plan) => (
                  <label
                    key={plan}
                    className="flex items-center gap-3 p-3 bg-[#1A1A1A] rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[#3DC4DB] cursor-pointer transition-colors"
                  >
                    <input type="radio" name="plan" className="text-[#3DC4DB]" />
                    <span className="text-white font-medium">{plan}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" size="large">
            {isRegister ? 'Crear mi cuenta' : 'Iniciar sesión'}
          </Button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
            <span className="text-xs text-[#888888]">o</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
          </div>

          <Button type="button" variant="secondary" className="w-full" size="large">
            Continuar con Google
          </Button>

          <div className="text-center mt-6">
            <p className="text-sm text-[#888888]">
              {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-[#3DC4DB] hover:underline font-medium"
              >
                {isRegister ? 'Inicia sesión' : 'Regístrate'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
