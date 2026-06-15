import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeUpgrade, upgradeToPro } from '../redux/slices/authSlice';
import { IoClose } from 'react-icons/io5';
import { LuCheck, LuCrown } from 'react-icons/lu';

// Colleague's Stripe test payment link (real card-payment path).
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_fZueVc39c0HW04Ic3IdIA00';

const PRO_FEATURES = [
  'Analyses de contrat illimitées',
  'Chat juridique illimité',
  'Upload de documents (📎) illimité',
  'Conversations illimitées',
  'Réponses ancrées sur la loi marocaine',
  'Support prioritaire',
];

export default function UpgradeModal() {
  const dispatch = useDispatch();
  const { upgradeOpen, user } = useSelector((s) => s.auth);
  const [activating, setActivating] = useState(false);

  if (!upgradeOpen) return null;

  const handleActivate = async () => {
    setActivating(true);
    await dispatch(upgradeToPro());
    setActivating(false);
  };

  const handleStripe = () => {
    const email = user?.email ? `?prefilled_email=${encodeURIComponent(user.email)}` : '';
    window.location.href = `${STRIPE_PAYMENT_LINK}${email}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         onClick={() => dispatch(closeUpgrade())}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
           onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-6 py-7 text-center">
          <button onClick={() => dispatch(closeUpgrade())}
                  className="absolute top-3 right-3 text-white/80 hover:text-white">
            <IoClose size={22} />
          </button>
          <div className="flex items-center justify-center gap-2 mb-1">
            <LuCrown size={24} />
            <h2 className="text-xl font-bold">LegalEase Pro</h2>
          </div>
          <p className="text-blue-100 text-sm">
            Vous avez utilisé vos 3 analyses gratuites. Débloquez l'accès illimité.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-3xl font-bold text-gray-900">149 MAD</span>
            <span className="text-gray-500 text-sm">/ mois</span>
          </div>

          <ul className="space-y-2.5 mb-6">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] text-gray-700">
                <LuCheck size={18} className="text-green-600 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleActivate}
            disabled={activating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 mb-2"
          >
            {activating ? 'Activation…' : 'Passer au Pro 🚀'}
          </button>

          <button
            onClick={handleStripe}
            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            Payer par carte (Stripe test)
          </button>

          <p className="text-[11px] text-gray-400 text-center mt-3">
            « Passer au Pro » active immédiatement votre compte (mode démo). En
            production, l'activation se fait après le paiement Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
