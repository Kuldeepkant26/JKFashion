import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { contact, company } from '../data/site';

/**
 * Floating WhatsApp button.
 *
 * Styled entirely with Tailwind utilities (no companion .css file) — buyers in
 * this trade open a WhatsApp thread far more often than they fill in a form,
 * so it stays reachable on every page.
 */
const WhatsAppFab = () => {
  const message = encodeURIComponent(
    `Hi ${company.name}, I'd like to enquire about your embroidery and lace products.`
  );

  return (
    <a
      href={`https://wa.me/${contact.whatsapp}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 z-[9998] flex items-center gap-0
                 rounded-full bg-[#25D366] px-4 py-4 text-white shadow-lg
                 shadow-black/25 transition-all duration-300 ease-out
                 hover:gap-2 hover:bg-[#1FB855] hover:shadow-xl
                 focus-visible:outline-2 focus-visible:outline-offset-2
                 focus-visible:outline-brand-pink
                 sm:bottom-8 sm:right-8"
    >
      <FaWhatsapp className="text-2xl shrink-0" aria-hidden="true" />
      <span
        className="max-w-0 overflow-hidden whitespace-nowrap font-body text-sm
                   font-medium opacity-0 transition-all duration-300 ease-out
                   group-hover:max-w-[9rem] group-hover:opacity-100"
      >
        Chat with us
      </span>
    </a>
  );
};

export default WhatsAppFab;
