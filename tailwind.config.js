import ivyWebTokens from 'ivy-design-system/tailwind/ivy-web';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Import Ivy Design System tokens
      ...ivyWebTokens.theme.extend,
      // Map shadcn color aliases to Ivy Design System semantic colors
      colors: {
        ...ivyWebTokens.theme.extend.colors,
        // Shadcn compatibility mappings
        border: "var(--color-shadcn-border)",
        input: "var(--color-shadcn-input)",
        ring: "var(--color-shadcn-ring)",
        background: "var(--color-shadcn-background)",
        foreground: "var(--color-shadcn-foreground)",
        primary: {
          DEFAULT: "var(--color-shadcn-primary)",
          foreground: "var(--color-shadcn-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-shadcn-secondary)",
          foreground: "var(--color-shadcn-secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--color-shadcn-destructive)",
          foreground: "var(--color-shadcn-destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-shadcn-muted)",
          foreground: "var(--color-shadcn-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-shadcn-accent)",
          foreground: "var(--color-shadcn-accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--color-shadcn-popover)",
          foreground: "var(--color-shadcn-popover-foreground)",
        },
        card: {
          DEFAULT: "var(--color-shadcn-card)",
          foreground: "var(--color-shadcn-card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}