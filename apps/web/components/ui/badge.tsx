import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/*
 * Badges name an event kind or a status. Signal variants map one-to-one to
 * the event kinds in a run trace; use them for nothing else.
 */
const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap",
    "rounded-md px-2 py-0.5 text-xs font-medium",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ],
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground",
        outline: "border border-input text-foreground",
        tool: "bg-signal-tool-soft text-signal-tool",
        sandbox: "bg-signal-sandbox-soft text-signal-sandbox",
        reasoning: "bg-signal-reasoning-soft text-signal-reasoning",
        error: "bg-signal-error-soft text-signal-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
