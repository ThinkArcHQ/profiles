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
      from === "user" ? "is-user" : "is-assistant",
      className
    )}
    {...props}
  />
);

const messageContentVariants = cva(
  "flex flex-col gap-2 rounded-lg text-sm flex-1 relative break-words overflow-wrap-anywhere",
  {
    variants: {
      variant: {
        contained: [
          "px-4 py-3",
          "group-[.is-user]:bg-orange-50 group-[.is-user]:text-gray-900 group-[.is-user]:border group-[.is-user]:border-orange-200",
          "group-[.is-assistant]:bg-gray-50 group-[.is-assistant]:text-gray-900 group-[.is-assistant]:border group-[.is-assistant]:border-gray-200",
        ],
        flat: [
          "group-[.is-user]:px-3 group-[.is-user]:py-2 group-[.is-user]:bg-orange-50 group-[.is-user]:text-gray-900 group-[.is-user]:border group-[.is-user]:border-orange-200 group-[.is-user]:rounded-lg",
          "group-[.is-assistant]:px-3 group-[.is-assistant]:py-2 group-[.is-assistant]:bg-gray-50 group-[.is-assistant]:text-gray-900 group-[.is-assistant]:border group-[.is-assistant]:border-gray-200 group-[.is-assistant]:rounded-lg",
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
  <Avatar className={cn("size-8 ring-1 ring-border flex-shrink-0", className)} {...props}>
    <AvatarImage alt="" className="mt-0 mb-0" src={src} />
    <AvatarFallback className="group-[.is-user]:bg-orange-500 group-[.is-user]:text-white group-[.is-assistant]:bg-gray-500 group-[.is-assistant]:text-white text-xs font-medium">
      {name?.slice(0, 2) || "ME"}
    </AvatarFallback>
  </Avatar>
);
