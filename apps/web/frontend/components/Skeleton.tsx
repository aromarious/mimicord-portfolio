function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#4f545c]/40 ${className || ""}`}
      {...props}
    />
  )
}

export { Skeleton }
