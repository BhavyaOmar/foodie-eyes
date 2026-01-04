"use client";
import React from "react";
import Link from "next/link";

type CardProps = {
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  isSelected?: boolean;
};

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  href,
  onClick,
  className = "",
  isSelected = false,
}) => {
  const content = (
    <div className={`rounded-[1rem] card-surface px-4 py-4 sm:py-5 transition-all duration-300 ${
      isSelected
        ? "bg-[var(--gold-400)]/20 border-2 border-[var(--gold-400)]"
        : "bg-[var(--card-bg)] border-2 border-transparent"
    }`}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`inline-block h-2.5 w-2.5 rounded-full transition-colors ${
            isSelected
              ? "bg-[var(--gold-500)]"
              : "bg-[var(--gold-400)] group-hover:bg-[var(--gold-500)]"
          }`}
        />
        <div className="flex-1">
          <p className={`text-[15px] sm:text-base leading-tight font-medium transition-colors ${
            isSelected ? "text-[var(--gold-600)]" : "text-slate-800"
          }`}>
            {title}
          </p>
          {subtitle ? (
            <p className="mt-1 text-[12px] sm:text-sm text-slate-600">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );

  const buttonClass = `group w-full text-left rounded-2xl p-[2px] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-black bg-transparent hover:bg-zinc-900/30 ${className}`;

  if (href) {
    return (
      <Link href={href} className={buttonClass}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonClass}
    >
      {content}
    </button>
  );
};

export default Card;