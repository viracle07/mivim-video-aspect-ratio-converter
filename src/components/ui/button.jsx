import Link from "next/link";
import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-mivim-600 text-white hover:bg-mivim-500",
  secondary: "border border-line bg-surface text-ink hover:bg-mist",
  ghost: "text-ink hover:bg-surface",
  danger: "bg-coral text-white hover:brightness-95"
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4",
  lg: "h-12 px-5"
};

export function Button(props) {
  const className = cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-mivim-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
    variants[props.variant ?? "primary"],
    sizes[props.size ?? "md"],
    props.className
  );

  if (props.asChild) {
    const { asChild, variant, size, className: _className, children, ...linkProps } = props;

    if (linkProps.href) {
      return (
        <Link className={className} {...linkProps}>
          {children}
        </Link>
      );
    }

    if (isValidElement(children)) {
      return cloneElement(children, {
        className: cn(className, children.props.className)
      });
    }

    return <span className={className}>{children}</span>;
  }

  const { asChild, variant, size, className: _className, ...buttonProps } = props;
  return <button className={className} {...buttonProps} />;
}
