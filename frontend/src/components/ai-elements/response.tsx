"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        "[&>p]:leading-relaxed [&>p]:text-[0.9375rem]",
        "[&>code]:bg-white/10 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-orange-300 [&>code]:text-sm",
        "[&>pre]:bg-black/30 [&>pre]:border [&>pre]:border-white/10 [&>pre]:rounded-lg [&>pre]:p-4 [&>pre]:overflow-x-auto",
        "[&>ul]:list-disc [&>ul]:ml-4 [&>ul]:space-y-1",
        "[&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:space-y-1",
        "[&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2",
        "[&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-2",
        "[&>h3]:text-base [&>h3]:font-semibold [&>h3]:mb-1",
        className
      )}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
