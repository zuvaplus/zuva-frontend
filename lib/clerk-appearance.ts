/**
 * Clerk appearance tokens aligned with the Zuva design system:
 *   background — #000000  vantablack
 *   primary    — #F5A623  African amber
 *
 * Pass to <SignIn appearance={clerkAppearance} /> and <SignUp appearance={clerkAppearance} />
 */
export const clerkAppearance = {
  variables: {
    colorBackground:      "#000000",
    colorPrimary:         "#F5A623",
    colorText:            "#F0F0F0",
    colorTextSecondary:   "#888888",
    colorInputBackground: "#0D0D0D",
    colorInputText:       "#F0F0F0",
    colorNeutral:         "#555555",
    colorDanger:          "#F87171",
    borderRadius:         "0.75rem",
    fontFamily:           "var(--font-geist-sans), system-ui, sans-serif",
    fontSize:             "0.9rem",
  },
  elements: {
    card:
      "border border-[rgba(245,166,35,0.15)] shadow-[0_0_32px_rgba(245,166,35,0.08)] rounded-3xl",
    formButtonPrimary:
      "bg-[#F5A623] hover:bg-[#F9B748] text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,166,35,0.35)]",
    footerActionLink:
      "text-[#F5A623] hover:text-[#F9B748]",
    formFieldInput:
      "rounded-xl border-[rgba(245,166,35,0.15)] focus:border-[rgba(245,166,35,0.45)] focus:ring-0",
    dividerLine:
      "bg-[rgba(245,166,35,0.1)]",
    dividerText:
      "text-[#555555]",
    socialButtonsBlockButton:
      "border border-[rgba(245,166,35,0.15)] hover:border-[rgba(245,166,35,0.35)] rounded-xl text-[#F0F0F0] bg-[#0D0D0D]",
    headerTitle:    "text-[#F0F0F0] font-bold",
    headerSubtitle: "text-[#888888]",
    identityPreviewEditButton: "text-[#F5A623]",
  },
} as const;
