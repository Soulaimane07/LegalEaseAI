import { loadStripe } from '@stripe/stripe-js';

// Replace with your Stripe Public Key
const stripePromise = loadStripe('pk_test_51PC4svCTx4GzaOVoTMOKKaZfg7nX0Vm548xLg8vW82EibDbPsMS1Wp3lfwcdz0t6fmYGNdWxnku9wiJy3o7XXuZD00dRswdDvl');

export const redirectToCheckout = async (planType = 'standard') => {
  const stripe = await stripePromise;
  
  // Call your backend to create a Stripe Checkout Session
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: planType }),
  });

  const session = await response.json();

  // Redirect to Stripe Checkout
  const result = await stripe.redirectToCheckout({
    sessionId: session.id,
  });

  if (result.error) console.error(result.error.message);
};