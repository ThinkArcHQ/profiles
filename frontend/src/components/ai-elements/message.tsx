import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, HTMLAttributes } from "react";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full items-start gap-3 py-3 relative",
      from === "user" ? "is-user flex-row-reverse" : "is-assistant flex-row",
      className
    )}
    {...props}
  />
);

const messageContentVariants = cva(
  "flex flex-col gap-2 rounded-xl text-sm relative break-words overflow-wrap-anywhere max-w-[80%] w-fit",
  {
    variants: {
      variant: {
        contained: [
          "px-4 py-3",
          "group-[.is-user]:bg-orange-600 group-[.is-user]:text-white group-[.is-user]:border-0 group-[.is-user]:shadow-lg group-[.is-user]:shadow-orange-500/20",
          "group-[.is-assistant]:bg-white/10 group-[.is-assistant]:text-white group-[.is-assistant]:border group-[.is-assistant]:border-white/20 group-[.is-assistant]:backdrop-blur-sm",
        ],
        flat: [
          "px-4 py-3 rounded-xl",
          "group-[.is-user]:bg-orange-600 group-[.is-user]:text-white group-[.is-user]:shadow-lg group-[.is-user]:shadow-orange-500/20",
          "group-[.is-assistant]:bg-white/10 group-[.is-assistant]:text-white group-[.is-assistant]:border group-[.is-assistant]:border-white/20 group-[.is-assistant]:backdrop-blur-sm",
        ],
      },
    },
    defaultVariants: {
      variant: "contained",
    },
  }
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageContentVariants>;

export const MessageContent = ({
  children,
  className,
  variant,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(messageContentVariants({ variant, className }))}
    {...props}
  >
    {children}
  </div>
);

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string;
  name?: string;
};

export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}: MessageAvatarProps) => (
  <Avatar className={cn("size-9 ring-2 flex-shrink-0 group-[.is-user]:ring-orange-500/30 group-[.is-assistant]:ring-white/20", className)} {...props}>
    <AvatarImage alt="" className="mt-0 mb-0" src={src} />
    <AvatarFallback className="group-[.is-user]:bg-orange-500 group-[.is-user]:text-white group-[.is-assistant]:bg-white/20 group-[.is-assistant]:text-white text-xs font-semibold">
      {name?.slice(0, 2) || "ME"}
    </AvatarFallback>
  </Avatar>
);
